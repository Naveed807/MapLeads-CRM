import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../../config/app';
import { JwtPayload } from '../../types/express';
import { AuthError } from '../errors/AppError';

export function authMiddleware(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next(new AuthError('No token provided'));
  }

  const token = header.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwt.accessSecret) as JwtPayload;
    req.user = {
      id:       payload.sub,
      email:    '',        // will be filled by tenant middleware if needed
      name:     '',
      isAdmin:  payload.isAdmin,
      role:     payload.role,
      orgId:    payload.orgId,
      planTier: payload.planTier,
    };
    next();
  } catch {
    next(new AuthError('Invalid or expired token'));
  }
}

// Admin-only guard — call after authMiddleware
export function adminMiddleware(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user?.isAdmin) {
    return next(new AuthError('Admin access required'));
  }
  next();
}
