import { Request, Response, NextFunction } from 'express';
import { Role } from '../shared/constants/roles.constant';
import { sendForbidden, sendUnauthorized } from '../shared/utils/response.util';

export const requireRole = (...roles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return sendUnauthorized(res, 'Authentication required');
    }

    if (!roles.includes(req.user.role)) {
      return sendForbidden(res, 'Insufficient permissions');
    }

    next();
  };
};

export const requireAdmin = requireRole('admin');
