import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import { sendSuccess, sendCreated, sendBadRequest } from '../../../shared/utils/response.util';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return sendBadRequest(res, 'Email and password are required');
      }

      const result = await authService.login(email, password);
      sendSuccess(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendBadRequest(res, 'Refresh token is required');
      }

      const result = await authService.refreshToken(refreshToken);
      sendSuccess(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  },

  async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await authService.getProfile(req.user!.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async createProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const { full_name } = req.body;
      const result = await authService.createUserProfile(
        req.user!.id,
        req.user!.email,
        full_name
      );
      sendCreated(res, result, 'Profile created');
    } catch (error) {
      next(error);
    }
  },

  async setRole(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      const result = await authService.setUserRole(userId, role);
      sendSuccess(res, result, 'Role updated');
    } catch (error) {
      next(error);
    }
  },

  async getAllUsers(req: Request, res: Response, next: NextFunction) {
    try {
      const users = await authService.getAllUsers();
      sendSuccess(res, users);
    } catch (error) {
      next(error);
    }
  },
};
