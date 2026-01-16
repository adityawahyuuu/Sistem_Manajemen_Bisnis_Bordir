import { Request, Response, NextFunction } from 'express';
import { companySettingsService } from '../services/company-settings.service';
import { sendSuccessWithDates } from '../../../shared/utils/response.util';

export const companySettingsController = {
  async getSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);

      const settings = await companySettingsService.getSettings(companyId, userId);

      sendSuccessWithDates(res, settings, 'Company settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateSettings(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const data = req.body;

      const settings = await companySettingsService.updateSettings(companyId, userId, data);

      sendSuccessWithDates(res, settings, 'Company settings updated successfully');
    } catch (error) {
      next(error);
    }
  },
};
