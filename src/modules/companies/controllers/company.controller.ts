import { Request, Response, NextFunction } from 'express';
import { companyService } from '../services/company.service';
import {
  sendSuccess,
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';
import { AppError } from '../../../middleware';
import * as fs from 'fs';
import * as path from 'path';

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

  async uploadLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.id);

      if (!req.file) {
        throw new AppError('No file uploaded', 400);
      }

      const company = await companyService.uploadLogo(companyId, userId, req.file);

      sendSuccessWithDates(res, company, 'Logo uploaded successfully');
    } catch (error) {
      next(error);
    }
  },

  async getLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.id);

      const logoUrl = await companyService.getLogoPublicUrl(companyId, userId);

      if (!logoUrl) {
        throw new AppError('Logo not found', 404);
      }

      res.json({
        logo_url: logoUrl,
      });
    } catch (error) {
      next(error);
    }
  },

  async deleteLogo(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.id);

      const company = await companyService.deleteLogo(companyId, userId);

      sendSuccessWithDates(res, company, 'Logo deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
