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

  // Body-parser / JSON.parse SyntaxError (malformed request body)
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    res.status(400).json(fail('INVALID_JSON', 'Request body contains invalid JSON'));
    return;
  }

  // Unknown errors — log and return generic 500
  logger.error('Unhandled error:', err);
  res.status(500).json(fail('SERVER_ERROR', 'An unexpected error occurred'));
}

// 404 handler
export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json(fail('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
}
