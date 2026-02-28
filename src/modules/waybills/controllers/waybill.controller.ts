import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { waybillService } from '../services/waybill.service';
import {
  sendSuccess,
  sendFail,
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';
import { waybills_status } from '../../../../prisma/generated/prisma';

export const waybillController = {
  async findAllByCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const customerId = req.query.customer_id ? parseInt(req.query.customer_id as string) : undefined;
      const invoiceId = req.query.invoice_id ? parseInt(req.query.invoice_id as string) : undefined;
      const status = req.query.status as waybills_status | undefined;
      const search = req.query.search as string | undefined;

      const { data, total } = await waybillService.findAllByCompany(
        companyId, userId, page, limit, customerId, invoiceId, status, search
      );

      sendSuccessWithDates(res, data, 'Waybills retrieved', 200, {
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

      const waybill = await waybillService.findById(id, companyId, userId);
      sendSuccessWithDates(res, waybill, 'Waybill retrieved');
    } catch (error) {
      next(error);
    }
  },

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const waybill = await waybillService.create(companyId, userId, {
        ...req.body,
        company_id: companyId,
      });

      sendCreatedWithDates(res, waybill, 'Waybill created');
    } catch (error) {
      next(error);
    }
  },

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const waybill = await waybillService.update(id, companyId, userId, req.body);
      sendSuccessWithDates(res, waybill, 'Waybill updated');
    } catch (error) {
      next(error);
    }
  },

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      await waybillService.delete(id, companyId, userId);
      sendSuccess(res, null, 'Waybill deleted');
    } catch (error) {
      next(error);
    }
  },

  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = Number(req.params.id);
      const companyId = Number(req.params.companyId);
      const userId = Number(req.user!.id);

      const result = await waybillService.generate(id, companyId, userId);

      sendSuccessWithDates(
        res,
        {
          fileName: result.fileName,
          waybill: result.waybill,
        },
        'Waybill document generated successfully'
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

      const filePath = await waybillService.getFilePath(id, companyId, userId);

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

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const { status } = req.body;

      const waybill = await waybillService.updateStatus(id, companyId, userId, status);
      sendSuccessWithDates(res, waybill, 'Waybill status updated');
    } catch (error) {
      next(error);
    }
  },
};
