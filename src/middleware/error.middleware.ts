import { Request, Response, NextFunction } from 'express';
import { logger } from '../shared/utils/logger.util';
import { sendError } from '../shared/utils/response.util';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Prisma errors
  if (err.code === 'P2002'){  // Unique constraint violation
    return sendError(res, 'Email already exists', 409);
  }

  if (err.code === 'P2025') {  // Record not found
    return sendError(res, 'Resource not found', 404);
  }

  if (err.code === 'P2003') {  // Foreign key constraint
    return sendError(res, 'Referenced resource not found', 400);
  }

  // Database errors
  if (err.code?.startsWith('P1')) {  // P1xxx = connection errors
    return sendError(res, 'Database connection error', 503);
  }
  
  if (err.message.includes('duplicate key')) {
    return sendError(res, 'Resource already exists', 409);
  }

  if (err.message.includes('violates foreign key')) {
    return sendError(res, 'Referenced resource not found', 400);
  }

  // Default error
  const statusCode = 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return sendError(res, message, statusCode);
};

export const notFoundHandler = (req: Request, res: Response) => {
  return sendError(res, `Route ${req.originalUrl} not found`, 404);
};
