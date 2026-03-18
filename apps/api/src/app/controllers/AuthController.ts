import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/AuthService';
import { ok } from '@mapleads/shared';
import { config } from '../../config/app';

const COOKIE_OPTS = {
  httpOnly: true,
  secure:   config.isProduction,
  sameSite: 'strict' as const,
  maxAge:   30 * 24 * 60 * 60 * 1000, // 30 days
};

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, tokens } = await authService.register(req.body);
      res.cookie('refresh_token', tokens.refreshToken, COOKIE_OPTS);
      res.status(201).json(ok({ user, accessToken: tokens.accessToken }, 'Account created successfully'));
    } catch (e) { next(e); }
  }

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { user, org, tokens } = await authService.login(req.body, req.ip, req.headers['user-agent']);
      res.cookie('refresh_token', tokens.refreshToken, COOKIE_OPTS);
      res.json(ok({ user, org, accessToken: tokens.accessToken }));
    } catch (e) { next(e); }
  }

  async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (!refreshToken) { res.status(401).json({ success: false, error: { code: 'NO_TOKEN', message: 'No refresh token' } }); return; }
      const tokens = await authService.refresh(refreshToken);
      res.cookie('refresh_token', tokens.refreshToken, COOKIE_OPTS);
      res.json(ok({ accessToken: tokens.accessToken }));
    } catch (e) { next(e); }
  }

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const refreshToken = req.cookies?.refresh_token;
      if (refreshToken) await authService.logout(refreshToken);
      res.clearCookie('refresh_token');
      res.json(ok(null, 'Logged out'));
    } catch (e) { next(e); }
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.forgotPassword(req.body.email);
      // Always return 200 — don't reveal if email exists
      res.json(ok(null, 'If that email exists, a reset link has been sent'));
    } catch (e) { next(e); }
  }

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await authService.resetPassword(req.body.token, req.body.password);
      res.json(ok(null, 'Password reset successfully'));
    } catch (e) { next(e); }
  }

  async me(req: Request, res: Response): Promise<void> {
    res.json(ok({ user: req.user, org: req.org }));
  }
}

export const authController = new AuthController();
