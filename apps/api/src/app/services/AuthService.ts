import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../../config/app';
import { prisma } from '../../config/database';
import { userRepository } from '../repositories/UserRepository';
import { organizationRepository } from '../repositories/OrganizationRepository';
import { AuthError, ConflictError, NotFoundError, AppError } from '../errors/AppError';
import { JwtPayload } from '../../types/express';
import { PLAN_SEED_DATA } from '../../config/plans';
import type { RegisterInput, LoginInput } from '@mapleads/shared';

const SALT_ROUNDS = 12;

export class AuthService {
  // ── Register ─────────────────────────────────────────────────────────────
  async register(input: RegisterInput) {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) throw new ConflictError('An account with this email already exists');

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);

    // Slugify org name
    const orgName = input.orgName || `${input.name}'s Workspace`;
    const slug    = await this.generateUniqueSlug(orgName);

    // Find BASIC plan
    const basicPlan = await prisma.plan.findUnique({ where: { tier: 'BASIC' } });
    if (!basicPlan) throw new AppError(500, 'SETUP_ERROR', 'Plans not seeded. Run: npm run db:seed');

    // Create user + org + member + subscription atomically
    const result = await prisma.$transaction(async (tx: any) => {
      const user = await tx.user.create({
        data: { email: input.email, passwordHash, name: input.name },
      });

      const org = await tx.organization.create({
        data: { name: orgName, slug },
      });

      await tx.orgMember.create({
        data: { userId: user.id, orgId: org.id, role: 'OWNER' },
      });

      const now = new Date();
      const end = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());

      const subscription = await tx.subscription.create({
        data: {
          orgId:              org.id,
          planId:             basicPlan.id,
          status:             'ACTIVE',
          currentPeriodStart: now,
          currentPeriodEnd:   end,
        },
        include: { plan: true },
      });

      return { user, org, subscription };
    });

    const tokens = this.generateTokens(result.user.id, result.org.id, 'OWNER', 'BASIC', false);
    await this.saveSession(result.user.id, tokens.refreshToken);

    return { user: this.safeUser(result.user), tokens };
  }

  // ── Login ─────────────────────────────────────────────────────────────────
  async login(input: LoginInput, ipAddress?: string, userAgent?: string) {
    const user = await userRepository.findByEmail(input.email);
    if (!user) throw new AuthError('Invalid email or password');
    if (user.isSuspended) throw new AuthError('Account suspended. Contact support.');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new AuthError('Invalid email or password');

    // Get primary org membership
    const membership = await prisma.orgMember.findFirst({
      where:   { userId: user.id },
      include: { org: { include: { subscription: { include: { plan: true } } } } },
      orderBy: { joinedAt: 'asc' },
    });

    // Admin users may have no org — still allow login with empty org context
    const orgId    = membership?.orgId    ?? '';
    const role     = membership?.role     ?? 'MEMBER';
    const planTier = (membership?.org.subscription?.plan.tier ?? 'BASIC') as any;

    const tokens = this.generateTokens(user.id, orgId, role, planTier, user.isAdmin);
    await this.saveSession(user.id, tokens.refreshToken, ipAddress, userAgent);

    // Update last login
    await userRepository.update(user.id, { lastLoginAt: new Date() });

    return { user: this.safeUser(user), org: membership?.org ?? null, tokens };
  }

  // ── Refresh ───────────────────────────────────────────────────────────────
  async refresh(refreshToken: string) {
    const session = await prisma.session.findUnique({ where: { refreshToken } });
    if (!session || session.expiresAt < new Date()) {
      if (session) await prisma.session.delete({ where: { id: session.id } });
      throw new AuthError('Refresh token expired or invalid');
    }

    const user = await prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || user.isSuspended) throw new AuthError('Account not found or suspended');

    const membership = await prisma.orgMember.findFirst({
      where:   { userId: user.id },
      include: { org: { include: { subscription: { include: { plan: true } } } } },
    });
    if (!membership) throw new AuthError('No organization found');

    const planTier = (membership.org.subscription?.plan.tier || 'BASIC') as any;
    const tokens   = this.generateTokens(user.id, membership.orgId, membership.role, planTier, user.isAdmin);

    // Rotate: delete old, save new
    await prisma.session.delete({ where: { id: session.id } });
    await this.saveSession(user.id, tokens.refreshToken);

    return tokens;
  }

  // ── Logout ────────────────────────────────────────────────────────────────
  async logout(refreshToken: string): Promise<void> {
    await prisma.session.deleteMany({ where: { refreshToken } });
  }

  // ── Forgot Password ───────────────────────────────────────────────────────
  async forgotPassword(email: string): Promise<{ token: string }> {
    const user = await userRepository.findByEmail(email);
    // Don't reveal if email exists
    if (!user) return { token: '' };

    const rawToken  = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordReset.deleteMany({ where: { userId: user.id } });
    await prisma.passwordReset.create({ data: { userId: user.id, tokenHash, expiresAt } });

    return { token: rawToken }; // caller should send via email
  }

  // ── Reset Password ────────────────────────────────────────────────────────
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const reset = await prisma.passwordReset.findUnique({ where: { tokenHash } });

    if (!reset || reset.expiresAt < new Date() || reset.usedAt) {
      throw new AppError(400, 'INVALID_TOKEN', 'Password reset link is invalid or expired');
    }

    const passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await prisma.$transaction([
      prisma.user.update({ where: { id: reset.userId }, data: { passwordHash } }),
      prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
      prisma.session.deleteMany({ where: { userId: reset.userId } }), // invalidate all sessions
    ]);
  }

  // ── Private helpers ───────────────────────────────────────────────────────
  private generateTokens(userId: string, orgId: string, role: any, planTier: any, isAdmin: boolean) {
    const payload: Omit<JwtPayload, 'iat' | 'exp'> = { sub: userId, orgId, role, planTier, isAdmin };

    const accessToken  = jwt.sign(payload, config.jwt.accessSecret,  { expiresIn: config.jwt.accessExpires  as any });
    const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, { expiresIn: config.jwt.refreshExpires as any });

    return { accessToken, refreshToken };
  }

  private async saveSession(userId: string, refreshToken: string, ipAddress?: string, userAgent?: string) {
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    await prisma.session.create({ data: { userId, refreshToken, ipAddress, userAgent, expiresAt } });
  }

  private safeUser(user: any) {
    const { passwordHash, ...safe } = user;
    return safe;
  }

  private async generateUniqueSlug(name: string): Promise<string> {
    let base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    let slug = base;
    let i    = 1;
    while (await prisma.organization.findUnique({ where: { slug } })) {
      slug = `${base}-${i++}`;
    }
    return slug;
  }
}

export const authService = new AuthService();
