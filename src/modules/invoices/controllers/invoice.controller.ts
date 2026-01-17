import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { invoiceService } from '../services/invoice.service';
import {
  sendSuccess,
  sendCreated,
  sendFail,
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';
import { invoices_status } from '../../../../prisma/generated/prisma';

export const invoiceController = {
  /**
   * Get all invoices for a company
   * GET /invoices/company/:companyId
   */
  async findAllByCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const status = req.query.status as invoices_status | undefined;
      const customerId = req.query.customer_id
        ? parseInt(req.query.customer_id as string)
        : undefined;
      const search = req.query.search as string | undefined;

      const { data, total } = await invoiceService.findAllByCompany(
        companyId,
        userId,
        page,
        limit,
        status,
        customerId,
        search
      );

      sendSuccessWithDates(res, data, 'Invoices retrieved', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get invoice by ID
   * GET /invoices/company/:companyId/:id
   */
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

  /**
   * Create new invoice
   * POST /invoices/company/:companyId
   */
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

  /**
   * Update invoice
   * PUT /invoices/company/:companyId/:id
   */
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

  /**
   * Delete invoice
   * DELETE /invoices/company/:companyId/:id
   */
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

  /**
   * Generate PDF for invoice
   * POST /invoices/company/:companyId/:id/generate
   */
  async generate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const result = await invoiceService.generate(id, companyId, userId);
      sendSuccessWithDates(
        res,
        {
          fileName: result.fileName,
          invoice: result.invoice,
        },
        'Invoice document generated successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  /**
   * Download invoice PDF
   * GET /invoices/company/:companyId/:id/download
   */
  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const filePath = await invoiceService.getFilePath(id, companyId, userId);

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

  /**
   * Update invoice status
   * PATCH /invoices/company/:companyId/:id/status
   */
  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const { status } = req.body;

      const invoice = await invoiceService.updateStatus(id, companyId, userId, status);
      sendSuccessWithDates(res, invoice, 'Invoice status updated');
    } catch (error) {
      next(error);
    }
  },
};
