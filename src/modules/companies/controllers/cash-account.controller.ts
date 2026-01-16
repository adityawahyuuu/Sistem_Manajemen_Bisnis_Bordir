import { Request, Response, NextFunction } from 'express';
import { cashAccountService } from '../services/cash-account.service';
import {
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';

export const cashAccountController = {
  async getAllAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);

      const accounts = await cashAccountService.getAllAccounts(companyId, userId);

      sendSuccessWithDates(res, accounts, 'Cash accounts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getAccountById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const accountId = parseInt(req.params.accountId);

      const account = await cashAccountService.getAccountById(accountId, companyId, userId);

      sendSuccessWithDates(res, account, 'Cash account retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async createAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const data = req.body;

      const account = await cashAccountService.createAccount(companyId, userId, data);

      sendCreatedWithDates(res, account, 'Cash account created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const accountId = parseInt(req.params.accountId);
      const data = req.body;

      const account = await cashAccountService.updateAccount(accountId, companyId, userId, data);

      sendSuccessWithDates(res, account, 'Cash account updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const accountId = parseInt(req.params.accountId);

      await cashAccountService.deleteAccount(accountId, companyId, userId);

      sendSuccessWithDates(res, null, 'Cash account deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
