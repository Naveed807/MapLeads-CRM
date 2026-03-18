import { Request, Response, NextFunction } from 'express';
import { prisma } from '../../config/database';
import { AuthError, NotFoundError } from '../errors/AppError';

// Attaches req.org (Organization + Subscription + Plan) for every authenticated request
export async function tenantMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  if (!req.user) return next(new AuthError());

  try {
    const org = await prisma.organization.findUnique({
      where: { id: req.user.orgId },
      include: {
        subscription: {
          include: { plan: true },
        },
      },
    });

    if (!org) return next(new NotFoundError('Organization'));
    if (!org.subscription) return next(new AuthError('No active subscription found'));

    req.org = {
      id:           org.id,
      name:         org.name,
      slug:         org.slug,
      locale:       org.locale,
      subscription: org.subscription as any,
    };

    next();
  } catch (err) {
    next(err);
  }
}
