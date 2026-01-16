import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { sendSuccessWithDates, sendCreatedWithDates } from '../../../shared/utils/response.util';

export const customerController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const { data, total } = await customerService.findAll(companyId, userId, page, limit, search);

      sendSuccessWithDates(res, data, 'Customers retrieved successfully', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const customerId = parseInt(req.params.customerId);

      const customer = await customerService.findById(customerId, companyId, userId);
      sendSuccessWithDates(res, customer, 'Customer retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const data = req.body;

      const customer = await customerService.create(companyId, userId, data);
      sendCreatedWithDates(res, customer, 'Customer created successfully');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const customerId = parseInt(req.params.customerId);
      const data = req.body;

      const customer = await customerService.update(customerId, companyId, userId, data);
      sendSuccessWithDates(res, customer, 'Customer updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const customerId = parseInt(req.params.customerId);

      await customerService.delete(customerId, companyId, userId);
      sendSuccessWithDates(res, null, 'Customer deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
