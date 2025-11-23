import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { invoiceService } from '../services/invoice.service';
import { sendSuccess, sendCreated, sendFail } from '../../../shared/utils/response.util';

export const invoiceController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as string;
      const customerId = req.query.customer_id as string;

      const { data, total } = await invoiceService.findAll(page, limit, status, customerId);
      sendSuccess(res, data, 'Invoices retrieved', 200, {
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
      const result = await invoiceService.findById(req.params.id);
      sendSuccess(res, result);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.create(req.body, req.user?.id);
      sendCreated(res, invoice, 'Invoice created');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const invoice = await invoiceService.update(req.params.id, req.body);
      sendSuccess(res, invoice, 'Invoice updated');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await invoiceService.delete(req.params.id);
      sendSuccess(res, null, 'Invoice deleted');
    } catch (error) {
      next(error);
    }
  },

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await invoiceService.generate(req.params.id);
      sendSuccess(res, {
        fileName: result.fileName,
        invoice: result.invoice,
      }, 'Invoice document generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const filePath = await invoiceService.getFilePath(req.params.id);

      // Check if file exists
      if (!fs.existsSync(filePath)) {
        return sendFail(res, 'File not found', 404);
      }

      const fileName = path.basename(filePath);

      // Set headers for file download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
      res.setHeader('Content-Length', fs.statSync(filePath).size);

      // Stream the file
      const fileStream = fs.createReadStream(filePath);
      fileStream.pipe(res);
    } catch (error) {
      next(error);
    }
  },
};
