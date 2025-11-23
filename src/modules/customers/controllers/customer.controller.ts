import { Request, Response, NextFunction } from 'express';
import { customerService } from '../services/customer.service';
import { sendSuccess, sendCreated } from '../../../shared/utils/response.util';

export const customerController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const search = req.query.search as string;

      const { data, total } = await customerService.findAll(page, limit, search);
      sendSuccess(res, data, 'Customers retrieved', 200, {
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
      const customer = await customerService.findById(req.params.id);
      sendSuccess(res, customer);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.create(req.body);
      sendCreated(res, customer, 'Customer created');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await customerService.update(req.params.id, req.body);
      sendSuccess(res, customer, 'Customer updated');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await customerService.delete(req.params.id);
      sendSuccess(res, null, 'Customer deleted');
    } catch (error) {
      next(error);
    }
  },
};
