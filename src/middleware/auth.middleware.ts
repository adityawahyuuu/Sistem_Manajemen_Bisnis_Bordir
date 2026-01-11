import { Request, Response, NextFunction } from 'express';
import { jwtService } from '../shared/services/jwt.service'
import { sendUnauthorized } from '../shared/utils/response.util';

export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return sendUnauthorized(res, 'No token provided');
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = jwtService.verify(token);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch {
    return sendUnauthorized(res, 'Invalid or expired token');
  }
};
