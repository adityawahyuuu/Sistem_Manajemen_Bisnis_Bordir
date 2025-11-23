import { Request, Response, NextFunction } from 'express';
import { auth } from '../database/firebase';
import { sendUnauthorized } from '../shared/utils/response.util';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No token provided');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      role: (decodedToken.role as 'admin' | 'user') || 'user',
    };
    next();
  } catch {
    return sendUnauthorized(res, 'Invalid or expired token');
  }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decodedToken = await auth.verifyIdToken(token);
    req.user = {
      id: decodedToken.uid,
      email: decodedToken.email || '',
      role: (decodedToken.role as 'admin' | 'user') || 'user',
    };
  } catch {
    // Token invalid, continue without user
  }

  next();
};
