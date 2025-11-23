import { waybillRepository } from '../repositories/waybill.repository';
import { CreateWaybillDto, UpdateWaybillDto } from '../interfaces/waybill.interface';
import { AppError } from '../../../middleware';
import { customerRepository } from '../../customers/repositories/customer.repository';
import { invoiceRepository } from '../../invoices/repositories/invoice.repository';
import { documentGenerator } from '../../../shared/utils/document.generator';

export const waybillService = {
  async findAll(page = 1, limit = 10, status?: string, customerId?: string) {
    return waybillRepository.findAll(page, limit, status, customerId);
  },

  async findById(id: string) {
    const result = await waybillRepository.findByIdWithItems(id);
    if (!result) throw new AppError('Waybill not found', 404);
    return result;
  },

  async create(data: CreateWaybillDto, userId?: string) {
    // Get invoice with items
    const invoiceResult = await invoiceRepository.findByIdWithItems(data.invoice_id);
    if (!invoiceResult) {
      throw new AppError('Invoice not found', 404);
    }

    const { invoice, items: invoiceItems } = invoiceResult;

    if (!invoiceItems || invoiceItems.length === 0) {
      throw new AppError('Invoice has no items', 400);
    }

    // Get customer from invoice
    const customer = await customerRepository.findById(invoice.customer_id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Map invoice items to waybill items
    const waybillItems = invoiceItems.map(item => ({
      name: item.item_name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      notes: '',
    }));

    // Create waybill with invoice data
    const waybillData = {
      ...data,
      customer_id: invoice.customer_id,
      items: waybillItems,
    };

    return waybillRepository.create(waybillData, userId);
  },

  async update(id: string, data: UpdateWaybillDto) {
    const waybill = await waybillRepository.update(id, data);
    if (!waybill) throw new AppError('Waybill not found', 404);
    return waybill;
  },

  async delete(id: string) {
    const deleted = await waybillRepository.delete(id);
    if (!deleted) throw new AppError('Waybill not found', 404);
    return true;
  },

  async generate(id: string) {
    const result = await waybillRepository.findByIdWithItems(id);
    if (!result) {
      throw new AppError('Waybill not found', 404);
    }

    const { waybill, items } = result;

    // Get customer data
    const customer = await customerRepository.findById(waybill.customer_id);
    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Get invoice number if linked
    let invoiceNumber = null;
    if (waybill.invoice_id) {
      const invoice = await invoiceRepository.findById(waybill.invoice_id);
      if (invoice) {
        invoiceNumber = invoice.invoice_number;
      }
    }

    // Prepare document data
    const documentData = {
      waybill_number: waybill.waybill_number,
      date: waybill.waybill_date instanceof Date
        ? waybill.waybill_date.toLocaleDateString('id-ID')
        : new Date(waybill.waybill_date).toLocaleDateString('id-ID'),
      customer_name: customer.name,
      delivery_address: waybill.destination_address || customer.address,
      delivery_city: waybill.destination_city || customer.city,
      delivery_province: waybill.destination_province || customer.province,
      invoice_number: invoiceNumber,
      vehicle_type: 'Kendaraan',
      vehicle_number: waybill.vehicle_number,
      driver_name: waybill.driver_name,
      driver_phone: '',
      items: items.map(item => ({
        description: item.item_name,
        quantity: item.quantity,
        unit: item.unit || 'pcs',
      })),
      notes: waybill.notes,
    };

    // Generate PDF
    const htmlContent = documentGenerator.generateWaybillHtml(documentData);
    const fileName = `waybill-${waybill.waybill_number}.pdf`;
    const filePath = await documentGenerator.generatePdf(htmlContent, fileName);

    // Update waybill with file path
    await waybillRepository.updateFilePath(id, fileName);

    return {
      filePath,
      fileName,
      waybill: { ...waybill, generated_file_path: fileName, status: 'generated' },
    };
  },

  async getFilePath(id: string) {
    const waybill = await waybillRepository.findById(id);
    if (!waybill) {
      throw new AppError('Waybill not found', 404);
    }
    if (!waybill.generated_file_path) {
      throw new AppError('Waybill document not generated yet', 400);
    }
    return documentGenerator.getFilePath(waybill.generated_file_path);
  },
};
