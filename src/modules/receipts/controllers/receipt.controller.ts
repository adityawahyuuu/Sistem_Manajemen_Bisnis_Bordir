import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { receiptService } from '../services/receipt.service';
import {
  sendSuccess,
  sendFail,
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';
import { receipts_payment_method } from '../../../../prisma/generated/prisma';

export const receiptController = {
  async findAllByCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const customerId = req.query.customer_id ? parseInt(req.query.customer_id as string) : undefined;
      const invoiceId = req.query.invoice_id ? parseInt(req.query.invoice_id as string) : undefined;
      const paymentMethod = req.query.payment_method as receipts_payment_method | undefined;
      const search = req.query.search as string | undefined;

      const { data, total } = await receiptService.findAllByCompany(
        companyId, userId, page, limit, customerId, invoiceId, paymentMethod, search
      );

      sendSuccessWithDates(res, data, 'Receipts retrieved', 200, {
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

      const receipt = await receiptService.findById(id, companyId, userId);
      sendSuccessWithDates(res, receipt, 'Receipt retrieved');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const receipt = await receiptService.create(companyId, userId, {
        ...req.body,
        company_id: companyId,
      });

      sendCreatedWithDates(res, receipt, 'Receipt created');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const receipt = await receiptService.update(id, companyId, userId, req.body);
      sendSuccessWithDates(res, receipt, 'Receipt updated');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      await receiptService.delete(id, companyId, userId);
      sendSuccess(res, null, 'Receipt deleted');
    } catch (error) {
      next(error);
    }
  },

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const companyId = Number(req.params.companyId);
      const userId = Number(req.user!.id);
      const templateId = req.query.templateId
        ? Number(req.query.templateId)
        : undefined;

      const result = await receiptService.generate(
        id,
        companyId,
        userId,
        templateId
      );
      sendSuccessWithDates(
        res,
        {
          fileName: result.fileName,
          receipt: result.receipt,
        },
        'Receipt document generated successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const filePath = await receiptService.getFilePath(id, companyId, userId);

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
};
