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
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  logger.error(`Error: ${err.message}`, { stack: err.stack, path: req.path });

  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Database errors
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
