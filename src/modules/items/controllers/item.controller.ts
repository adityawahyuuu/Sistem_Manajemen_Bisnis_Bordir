import { Request, Response, NextFunction } from 'express';
import { itemService } from '../services/item.service';
import {
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';

export const itemController = {
  async getAllItems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);

      const items = await itemService.getAllItems(companyId, userId);

      sendSuccessWithDates(res, items, 'Items retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async getItemById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const itemId = parseInt(req.params.itemId);

      const item = await itemService.getItemById(itemId, companyId, userId);

      sendSuccessWithDates(res, item, 'Item retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const data = req.body;

      const item = await itemService.createItem(companyId, userId, data);

      sendCreatedWithDates(res, item, 'Item created successfully');
    } catch (error) {
      next(error);
    }
  },

  async updateItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const itemId = parseInt(req.params.itemId);
      const data = req.body;

      const item = await itemService.updateItem(itemId, companyId, userId, data);

      sendSuccessWithDates(res, item, 'Item updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deleteItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const itemId = parseInt(req.params.itemId);

      await itemService.deleteItem(itemId, companyId, userId);

      sendSuccessWithDates(res, null, 'Item deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  async getCustomerItems(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const customerId = parseInt(req.params.customerId);

      const items = await itemService.getCustomerItems(customerId, companyId, userId);

      sendSuccessWithDates(res, items, 'Customer items retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  async addItemToCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const customerId = parseInt(req.params.customerId);
      const data = req.body;

      const customerItem = await itemService.addItemToCustomer(customerId, companyId, userId, data);

      sendCreatedWithDates(res, customerItem, 'Item added to customer successfully');
    } catch (error) {
      next(error);
    }
  },

  async removeItemFromCustomer(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);
      const companyId = parseInt(req.params.companyId);
      const customerId = parseInt(req.params.customerId);
      const customerItemId = parseInt(req.params.customerItemId);

      await itemService.removeItemFromCustomer(customerItemId, customerId, companyId, userId);

      sendSuccessWithDates(res, null, 'Item removed from customer successfully');
    } catch (error) {
      next(error);
    }
  },
};
