import { receiptRepository } from '../repositories/receipt.repository';
import { CreateReceiptDto, UpdateReceiptDto } from '../interfaces/receipt.interface';
import { AppError } from '../../../middleware';
import { customerRepository } from '../../customers/repositories/customer.repository';
import { invoiceRepository } from '../../invoices/repositories/invoice.repository';
import { documentGenerator } from '../../../shared/utils/document.generator';

export const receiptService = {
  async findAll(page = 1, limit = 10, customerId?: string) {
    return receiptRepository.findAll(page, limit, customerId);
  },

  async findById(id: string) {
    const receipt = await receiptRepository.findById(id);
    if (!receipt) throw new AppError('Receipt not found', 404);
    return receipt;
  },

  async create(data: CreateReceiptDto, userId?: string) {
    return receiptRepository.create(data, userId);
  },

  async update(id: string, data: UpdateReceiptDto) {
    const receipt = await receiptRepository.update(id, data);
    if (!receipt) throw new AppError('Receipt not found', 404);
    return receipt;
  },

  async delete(id: string) {
    const deleted = await receiptRepository.delete(id);
    if (!deleted) throw new AppError('Receipt not found', 404);
    return true;
  },

  async generate(id: string) {
    const receipt = await receiptRepository.findById(id);
    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    // Get customer data
    const customer = await customerRepository.findById(receipt.customer_id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Get invoice data if linked
    let invoiceNumber = null;
    if (receipt.invoice_id) {
      const invoice = await invoiceRepository.findById(receipt.invoice_id);
      if (invoice) {
        invoiceNumber = invoice.invoice_number;
      }
    }

    // Prepare document data
    const documentData = {
      receipt_number: receipt.receipt_number,
      receipt_date: receipt.receipt_date instanceof Date
        ? receipt.receipt_date.toLocaleDateString('id-ID')
        : new Date(receipt.receipt_date).toLocaleDateString('id-ID'),
      customer_name: customer.name,
      amount: receipt.amount,
      payment_method: receipt.payment_method,
      invoice_number: invoiceNumber,
      description: receipt.description,
      received_by: receipt.received_by,
      notes: receipt.notes,
    };

    // Generate PDF
    const htmlContent = documentGenerator.generateReceiptHtml(documentData);
    const fileName = `receipt-${receipt.receipt_number}.pdf`;
    const filePath = await documentGenerator.generatePdf(htmlContent, fileName);

    // Update receipt with file path
    await receiptRepository.updateFilePath(id, fileName);

    return {
      filePath,
      fileName,
      receipt: { ...receipt, generated_file_path: fileName, status: 'generated' },
    };
  },

  async getFilePath(id: string) {
    const receipt = await receiptRepository.findById(id);
    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }
    if (!receipt.generated_file_path) {
      throw new AppError('Receipt document not generated yet', 400);
    }
    return documentGenerator.getFilePath(receipt.generated_file_path);
  },
};
