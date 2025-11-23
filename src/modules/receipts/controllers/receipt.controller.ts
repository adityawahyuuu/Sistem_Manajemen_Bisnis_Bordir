import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { receiptService } from '../services/receipt.service';
import { sendSuccess, sendCreated, sendFail } from '../../../shared/utils/response.util';

export const receiptController = {
  async findAll(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const customerId = req.query.customer_id as string;

      const { data, total } = await receiptService.findAll(page, limit, customerId);
      sendSuccess(res, data, 'Receipts retrieved', 200, {
        page, limit, total, totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },

  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const receipt = await receiptService.findById(req.params.id);
      sendSuccess(res, receipt);
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const receipt = await receiptService.create(req.body, req.user?.id);
      sendCreated(res, receipt, 'Receipt created');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const receipt = await receiptService.update(req.params.id, req.body);
      sendSuccess(res, receipt, 'Receipt updated');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      await receiptService.delete(req.params.id);
      sendSuccess(res, null, 'Receipt deleted');
    } catch (error) {
      next(error);
    }
  },

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await receiptService.generate(req.params.id);
      sendSuccess(res, {
        fileName: result.fileName,
        receipt: result.receipt,
      }, 'Receipt document generated successfully');
    } catch (error) {
      next(error);
    }
  },

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const filePath = await receiptService.getFilePath(req.params.id);

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
