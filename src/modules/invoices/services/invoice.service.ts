import { invoiceRepository } from '../repositories/invoice.repository';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../interfaces/invoice.interface';
import { AppError } from '../../../middleware';
import { customerRepository } from '../../customers/repositories/customer.repository';
import { documentGenerator } from '../../../shared/utils/document.generator';

export const invoiceService = {
  async findAll(page = 1, limit = 10, status?: string, customerId?: string) {
    return invoiceRepository.findAll(page, limit, status, customerId);
  },

  async findById(id: string) {
    const result = await invoiceRepository.findByIdWithItems(id);
    if (!result) {
      throw new AppError('Invoice not found', 404);
    }
    return result;
  },

  async create(data: CreateInvoiceDto, userId?: string) {
    return invoiceRepository.create(data, userId);
  },

  async update(id: string, data: UpdateInvoiceDto) {
    const updateData: Record<string, unknown> = { ...data };
    if (data.due_date) {
      updateData.due_date = new Date(data.due_date);
    }
    const invoice = await invoiceRepository.update(id, updateData);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    return invoice;
  },

  async delete(id: string) {
    const deleted = await invoiceRepository.delete(id);
    if (!deleted) {
      throw new AppError('Invoice not found', 404);
    }
    return true;
  },

  async updateStatus(id: string, status: string) {
    const invoice = await invoiceRepository.update(id, { status });
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    return invoice;
  },

  async generate(id: string) {
    const result = await invoiceRepository.findByIdWithItems(id);
    if (!result) {
      throw new AppError('Invoice not found', 404);
    }

    const { invoice, items } = result;

    // Get customer data
    const customer = await customerRepository.findById(invoice.customer_id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Prepare document data
    const documentData = {
      invoice_number: invoice.invoice_number,
      date: invoice.invoice_date instanceof Date
        ? invoice.invoice_date.toLocaleDateString('id-ID')
        : new Date(invoice.invoice_date).toLocaleDateString('id-ID'),
      due_date: invoice.due_date
        ? (invoice.due_date instanceof Date
          ? invoice.due_date.toLocaleDateString('id-ID')
          : new Date(invoice.due_date).toLocaleDateString('id-ID'))
        : '-',
      status: invoice.status,
      customer_name: customer.name,
      customer_company: customer.company_name,
      customer_address: `${customer.address || ''}, ${customer.city || ''}, ${customer.province || ''}`,
      customer_phone: customer.phone,
      items: items.map(item => ({
        description: item.item_name + (item.description ? ` - ${item.description}` : ''),
        quantity: item.quantity,
        unit: 'pcs',
        unit_price: item.unit_price,
        total: item.total_price,
      })),
      subtotal: invoice.subtotal,
      discount: invoice.discount_amount,
      tax: invoice.tax_amount,
      total: invoice.total_amount,
      notes: invoice.notes,
    };

    // Generate PDF
    const htmlContent = documentGenerator.generateInvoiceHtml(documentData);
    const fileName = `invoice-${invoice.invoice_number}.pdf`;
    const filePath = await documentGenerator.generatePdf(htmlContent, fileName);

    // Update invoice with file path
    await invoiceRepository.updateFilePath(id, fileName);

    return {
      filePath,
      fileName,
      invoice: { ...invoice, generated_file_path: fileName, status: 'generated' },
    };
  },

  async getFilePath(id: string) {
    const invoice = await invoiceRepository.findById(id);
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }
    if (!invoice.generated_file_path) {
      throw new AppError('Invoice document not generated yet', 400);
    }
    return documentGenerator.getFilePath(invoice.generated_file_path);
  },
};
