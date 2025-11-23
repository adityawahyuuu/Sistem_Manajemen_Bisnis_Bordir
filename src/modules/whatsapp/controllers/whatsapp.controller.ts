import { Request, Response, NextFunction } from 'express';
import { whatsappService } from '../services/whatsapp.service';
import { sendSuccess, sendFail } from '../../../shared/utils/response.util';
import { invoiceService } from '../../invoices/services/invoice.service';
import { receiptService } from '../../receipts/services/receipt.service';
import { waybillService } from '../../waybills/services/waybill.service';
import { customerRepository } from '../../customers/repositories/customer.repository';
import * as QRCode from 'qrcode';

export const whatsappController = {
  async initialize(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await whatsappService.initialize();

      let qrCodeImage = null;
      if (result.qrCode) {
        qrCodeImage = await QRCode.toDataURL(result.qrCode);
      }

      sendSuccess(res, {
        status: result.status,
        qrCode: qrCodeImage,
      }, 'WhatsApp initialization started');
    } catch (error) {
      next(error);
    }
  },

  async getStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const status = whatsappService.getStatus();

      let qrCodeImage = null;
      if (status.qrCode) {
        qrCodeImage = await QRCode.toDataURL(status.qrCode);
      }

      sendSuccess(res, {
        isConnected: status.isConnected,
        isConnecting: status.isConnecting,
        qrCode: qrCodeImage,
      }, 'WhatsApp status retrieved');
    } catch (error) {
      next(error);
    }
  },

  async sendMessage(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber, message } = req.body;

      if (!phoneNumber || !message) {
        return sendFail(res, 'Phone number and message are required', 400);
      }

      const result = await whatsappService.sendMessage(phoneNumber, message);
      sendSuccess(res, {
        messageId: result.key?.id,
        to: phoneNumber,
      }, 'Message sent successfully');
    } catch (error) {
      next(error);
    }
  },

  async sendDocument(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber, filePath, fileName, caption } = req.body;

      if (!phoneNumber || !filePath || !fileName) {
        return sendFail(res, 'Phone number, file path, and file name are required', 400);
      }

      const result = await whatsappService.sendDocument(
        phoneNumber,
        filePath,
        fileName,
        caption
      );

      sendSuccess(res, {
        messageId: result.key?.id,
        to: phoneNumber,
        fileName,
      }, 'Document sent successfully');
    } catch (error) {
      next(error);
    }
  },

  async checkNumber(req: Request, res: Response, next: NextFunction) {
    try {
      const { phoneNumber } = req.params;

      if (!phoneNumber) {
        return sendFail(res, 'Phone number is required', 400);
      }

      const exists = await whatsappService.checkNumberExists(phoneNumber);
      sendSuccess(res, {
        phoneNumber,
        exists,
      }, exists ? 'Number is registered on WhatsApp' : 'Number is not registered on WhatsApp');
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      await whatsappService.logout();
      sendSuccess(res, null, 'WhatsApp logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  // Send invoice via WhatsApp
  async sendInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { phoneNumber, message } = req.body;

      // Get invoice and generate if not already generated
      const invoiceData = await invoiceService.findById(id);
      const invoice = invoiceData.invoice;

      if (!invoice.generated_file_path) {
        await invoiceService.generate(id);
      }

      const filePath = await invoiceService.getFilePath(id);
      const targetPhone = phoneNumber || await getCustomerPhone(invoice.customer_id);

      if (!targetPhone) {
        return sendFail(res, 'No phone number available for this customer', 400);
      }

      // Send document
      const result = await whatsappService.sendDocument(
        targetPhone,
        filePath,
        `Invoice-${invoice.invoice_number}.pdf`,
        message || `Invoice ${invoice.invoice_number} - Total: Rp ${invoice.total_amount.toLocaleString('id-ID')}`
      );

      sendSuccess(res, {
        messageId: result.key?.id,
        to: targetPhone,
        invoiceNumber: invoice.invoice_number,
      }, 'Invoice sent via WhatsApp');
    } catch (error) {
      next(error);
    }
  },

  // Send receipt via WhatsApp
  async sendReceipt(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { phoneNumber, message } = req.body;

      // Get receipt and generate if not already generated
      const receipt = await receiptService.findById(id);

      if (!receipt.generated_file_path) {
        await receiptService.generate(id);
      }

      const filePath = await receiptService.getFilePath(id);
      const targetPhone = phoneNumber || await getCustomerPhone(receipt.customer_id);

      if (!targetPhone) {
        return sendFail(res, 'No phone number available for this customer', 400);
      }

      // Send document
      const result = await whatsappService.sendDocument(
        targetPhone,
        filePath,
        `Receipt-${receipt.receipt_number}.pdf`,
        message || `Kwitansi ${receipt.receipt_number} - Rp ${receipt.amount.toLocaleString('id-ID')}`
      );

      sendSuccess(res, {
        messageId: result.key?.id,
        to: targetPhone,
        receiptNumber: receipt.receipt_number,
      }, 'Receipt sent via WhatsApp');
    } catch (error) {
      next(error);
    }
  },

  // Send waybill via WhatsApp
  async sendWaybill(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { phoneNumber, message } = req.body;

      // Get waybill and generate if not already generated
      const waybillData = await waybillService.findById(id);
      const waybill = waybillData.waybill;

      if (!waybill.generated_file_path) {
        await waybillService.generate(id);
      }

      const filePath = await waybillService.getFilePath(id);
      const targetPhone = phoneNumber || await getCustomerPhone(waybill.customer_id);

      if (!targetPhone) {
        return sendFail(res, 'No phone number available for this customer', 400);
      }

      // Send document
      const result = await whatsappService.sendDocument(
        targetPhone,
        filePath,
        `Waybill-${waybill.waybill_number}.pdf`,
        message || `Surat Jalan ${waybill.waybill_number}`
      );

      sendSuccess(res, {
        messageId: result.key?.id,
        to: targetPhone,
        waybillNumber: waybill.waybill_number,
      }, 'Waybill sent via WhatsApp');
    } catch (error) {
      next(error);
    }
  },
};

// Helper function to get customer phone
async function getCustomerPhone(customerId: string): Promise<string | null> {
  const customer = await customerRepository.findById(customerId);
  if (!customer) return null;

  // Try WhatsApp numbers first, then regular phone
  if (customer.whatsapp_numbers && customer.whatsapp_numbers.length > 0) {
    return customer.whatsapp_numbers[0];
  }
  return customer.phone || null;
}