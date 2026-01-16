import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service';
import {
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';

export const companyController = {
  async getAllCompanies(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companies = await companyService.getAllCompanies(userId);

      sendSuccessWithDates(res, companies, 'Companies retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCompanyById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.id);

      const company = await companyService.getCompanyById(companyId, userId);

      sendSuccessWithDates(res, company, 'Company retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async createCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const data = req.body;

      const company = await companyService.createCompany(userId, data);

      sendCreatedWithDates(res, company, 'Company created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.id);
      const data = req.body;

      const company = await companyService.updateCompany(companyId, userId, data);

      sendSuccessWithDates(res, company, 'Company updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.id);

      await companyService.deleteCompany(companyId, userId);

      sendSuccessWithDates(res, null, 'Company deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
