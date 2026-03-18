import { Request, Response, NextFunction } from 'express';
import { fail } from '@mapleads/shared';
import { AppError } from '../errors/AppError';
import { logger } from './logger';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

// Global error handler — must have 4 params for Express to recognise it
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // Known application errors
  if (err instanceof AppError) {
    res.status(err.statusCode).json(fail(err.code, err.message, err.details));
    return;
  }

  // Prisma unique constraint violation
  if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
    res.status(409).json(fail('CONFLICT', 'Record already exists'));
    return;
  }

  // Unknown errors — log and return generic 500
  logger.error('Unhandled error:', err);
  const isDev = process.env.NODE_ENV !== 'production';
  res.status(500).json(fail('SERVER_ERROR', isDev ? String(err) : 'An unexpected error occurred'));
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}
