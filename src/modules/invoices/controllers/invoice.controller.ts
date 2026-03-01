import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { invoiceService } from '../services/invoice.service';
import {
  sendSuccess,
  sendFail,
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';

export const invoiceController = {
  async findAllByCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const customerId = req.query.customer_id ? parseInt(req.query.customer_id as string) : undefined;
      const search = req.query.search as string | undefined;
      const dateFrom = req.query.date_from ? new Date(req.query.date_from as string) : undefined;
      const dateTo = req.query.date_to ? new Date(req.query.date_to as string) : undefined;
      const paymentStatus = req.query.payment_status as 'lunas' | 'dp' | 'belum_bayar' | undefined;

      const { data, total } = await invoiceService.findAllByCompany(
        companyId, userId, page, limit, customerId, search, dateFrom, dateTo, paymentStatus
      );

      sendSuccessWithDates(res, data, 'Invoices retrieved', 200, {
        page, limit, total, totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const invoice = await invoiceService.findById(id, companyId, userId);
      sendSuccessWithDates(res, invoice, 'Invoice retrieved');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const invoice = await invoiceService.create(companyId, userId, {
        ...req.body,
        company_id: companyId,
      });

      sendCreatedWithDates(res, invoice, 'Invoice created');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const invoice = await invoiceService.update(id, companyId, userId, req.body);
      sendSuccessWithDates(res, invoice, 'Invoice updated');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      await invoiceService.delete(id, companyId, userId);
      sendSuccess(res, null, 'Invoice deleted');
    } catch (error) {
      next(error);
    }
  },

  async getPaymentHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const history = await invoiceService.getPaymentHistory(id, companyId, userId);
      sendSuccessWithDates(res, history, 'Payment history retrieved');
    } catch (error) {
      next(error);
    }
  },


  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const result = await invoiceService.generate(id, companyId, userId);
      sendSuccessWithDates(res, { fileName: result.fileName }, 'Invoice document generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const filePath = await invoiceService.getFilePath(id, companyId, userId);

      if (!fs.existsSync(filePath)) {
        return sendFail(res, 'File not found', 404);
      }

      const fileName = path.basename(filePath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fs.statSync(filePath).size);

      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },

  async addPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const payment = await invoiceService.addPayment(invoiceId, companyId, userId, req.body);
      sendCreatedWithDates(res, payment, 'Payment added successfully');
    } catch (error) {
      next(error);
    }
  },

  async updatePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = parseInt(req.params.id);
      const paymentId = parseInt(req.params.paymentId);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const payment = await invoiceService.updatePayment(invoiceId, paymentId, companyId, userId, req.body);
      sendSuccessWithDates(res, payment, 'Payment updated successfully');
    } catch (error) {
      next(error);
    }
  },

  async deletePayment(req: Request, res: Response, next: NextFunction) {
    try {
      const invoiceId = parseInt(req.params.id);
      const paymentId = parseInt(req.params.paymentId);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      await invoiceService.deletePayment(invoiceId, paymentId, companyId, userId);
      sendSuccess(res, null, 'Payment deleted successfully');
    } catch (error) {
      next(error);
    }
  },

};
