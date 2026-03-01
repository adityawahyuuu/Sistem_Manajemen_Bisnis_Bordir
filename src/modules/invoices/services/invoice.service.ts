import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../../../database/prisma.client';
import { CreateInvoiceDto, UpdateInvoiceDto, CreatePaymentDto, UpdatePaymentDto } from '../interfaces/invoice.interface';
import { AppError } from '../../../middleware';
import { documentGenerator } from '../../../shared/utils/document.generator.util';
import { invoices_payment_status, receipts_payment_method, invoice_items_discount_type } from '../../../../prisma/generated/prisma';

const calcItemDiscount = (quantity: number, unit_price: number, discount_amount: number, discount_type: string): number => {
  if (discount_type === 'persen') return quantity * unit_price * (discount_amount / 100);
  return discount_amount;
};

const calcItemTotal = (quantity: number, unit_price: number, discount_amount: number, discount_type: string): number => {
  return quantity * unit_price - calcItemDiscount(quantity, unit_price, discount_amount, discount_type);
};
import { storageConfig } from '../../../config/app.config';
import {
  getDefaultInvoiceTemplate,
  DocumentData,
} from '../../../shared/utils/html-builder.util';

export const invoiceService = {
  async findAllByCompany(
    companyId: number,
    userId: number,
    page = 1,
    limit = 10,
    customerId?: number,
    search?: string,
    dateFrom?: Date,
    dateTo?: Date,
    paymentStatus?: 'lunas' | 'dp' | 'belum_bayar'
  ) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) throw new AppError('Company not found or access denied', 404);

    const where: Record<string, unknown> = {
      company_id: companyId,
      ...(customerId && { customer_id: customerId }),
      ...(paymentStatus && { payment_status: paymentStatus }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search } },
          { customers: { name: { contains: search } } },
          { customers: { company_name: { contains: search } } },
          { po_number: { contains: search } },
        ],
      }),
      ...((dateFrom || dateTo) && {
        invoice_date: {
          ...(dateFrom && { gte: dateFrom }),
          ...(dateTo && { lte: dateTo }),
        },
      }),
    };

    const includeOpts = {
      invoice_items: true,
      customers: { select: { id: true, name: true, company_name: true } },
      companies: { select: { id: true, name: true } },
    };

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: includeOpts,
      }),
      prisma.invoices.count({ where }),
    ]);

    return { data: invoices, total };
  },

  async findById(id: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) throw new AppError('Company not found or access denied', 404);

    const invoice = await prisma.invoices.findFirst({
      where: { id, company_id: companyId },
      include: {
        invoice_items: true,
        customers: true,
        companies: { include: { company_settings: true } },
        users: { select: { id: true, name: true, email: true } },
        invoice_payments: {
          orderBy: { payment_date: 'asc' },
        },
      },
    });

    if (!invoice) throw new AppError('Invoice not found', 404);

    return invoice;
  },

  async create(companyId: number, userId: number, data: CreateInvoiceDto) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
      include: { company_settings: true },
    });

    if (!company) throw new AppError('Company not found or access denied', 404);

    const customer = await prisma.customers.findFirst({
      where: { id: data.customer_id, company_id: companyId },
    });

    if (!customer) throw new AppError('Customer not found or does not belong to this company', 404);

    const invoiceNumber = await this.generateInvoiceNumber(companyId, company.company_settings);

    const subtotal = data.items.reduce((sum, item) => {
      return sum + calcItemTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.discount_type || 'Rp');
    }, 0);

    const taxAmount = data.tax_amount || 0;
    const discountAmount = data.discount_amount || 0;
    const shippingCost = data.shipping_cost || 0;
    const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;

    const baseData = {
      company_id: companyId,
      customer_id: data.customer_id,
      invoice_date: data.invoice_date ? new Date(data.invoice_date) : new Date(),
      due_date: data.due_date ? new Date(data.due_date) : null,
      po_number: data.po_number || null,
      subtotal,
      tax_amount: taxAmount,
      discount_amount: discountAmount,
      shipping_cost: shippingCost,
      total_amount: totalAmount,
      notes: data.notes || null,
      created_by: userId,
    };

    const itemsData = data.items.map((item) => ({
      item_id: item.item_id,
      item_name: item.name,
      description: item.description || null,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      unit_price: item.unit_price,
      discount_type: (item.discount_type || 'Rp') as invoice_items_discount_type,
      discount_amount: item.discount_amount || 0,
      total_price: calcItemTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.discount_type || 'Rp'),
    }));

    const doCreate = (number: string) =>
      prisma.invoices.create({
        data: { ...baseData, invoice_number: number, invoice_items: { create: itemsData } },
        include: { invoice_items: true, customers: true },
      });

    try {
      return await doCreate(invoiceNumber);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const retryNumber = await this.generateInvoiceNumber(companyId, company.company_settings);
        return doCreate(retryNumber);
      }
      throw err;
    }
  },

  async update(id: number, companyId: number, userId: number, data: UpdateInvoiceDto) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) throw new AppError('Company not found or access denied', 404);

    const existingInvoice = await prisma.invoices.findFirst({
      where: { id, company_id: companyId },
      include: { invoice_items: true },
    });

    if (!existingInvoice) throw new AppError('Invoice not found', 404);

    let subtotal = Number(existingInvoice.subtotal);
    if (data.items && data.items.length > 0) {
      subtotal = data.items.reduce((sum, item) => {
        return sum + calcItemTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.discount_type || 'Rp');
      }, 0);
    }

    const taxAmount = data.tax_amount ?? Number(existingInvoice.tax_amount);
    const discountAmount = data.discount_amount ?? Number(existingInvoice.discount_amount);
    const shippingCost = data.shipping_cost ?? Number(existingInvoice.shipping_cost);
    const totalAmount = subtotal - discountAmount + shippingCost + taxAmount;

    const invoice = await prisma.$transaction(async (tx) => {
      if (data.items && data.items.length > 0) {
        await tx.invoice_items.deleteMany({ where: { invoice_id: id } });
      }

      return tx.invoices.update({
        where: { id },
        data: {
          due_date: data.due_date ? new Date(data.due_date) : undefined,
          po_number: data.po_number !== undefined ? data.po_number : undefined,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          shipping_cost: shippingCost,
          subtotal: data.items ? subtotal : undefined,
          total_amount: totalAmount,
          notes: data.notes,
          updated_at: new Date(),
          ...(data.items && data.items.length > 0
            ? {
                invoice_items: {
                  create: data.items.map((item) => ({
                    item_id: item.item_id,
                    item_name: item.name,
                    description: item.description || null,
                    quantity: item.quantity,
                    unit: item.unit || 'pcs',
                    unit_price: item.unit_price,
                    discount_type: (item.discount_type || 'Rp') as invoice_items_discount_type,
                    discount_amount: item.discount_amount || 0,
                    total_price: calcItemTotal(item.quantity, item.unit_price, item.discount_amount || 0, item.discount_type || 'Rp'),
                  })),
                },
              }
            : {}),
        },
        include: {
          invoice_items: true,
          customers: true,
          companies: { select: { id: true, name: true } },
        },
      });
    });

    return invoice;
  },

  async delete(id: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) throw new AppError('Company not found or access denied', 404);

    const existingInvoice = await prisma.invoices.findFirst({
      where: { id, company_id: companyId },
      include: { receipts: true, waybills: true },
    });

    if (!existingInvoice) throw new AppError('Invoice not found', 404);

    const linkedParts: string[] = [];
    if (existingInvoice.receipts.length > 0) {
      const numbers = existingInvoice.receipts.map((r) => r.receipt_number).join(', ');
      linkedParts.push(`receipts (${numbers})`);
    }
    if (existingInvoice.waybills.length > 0) {
      const numbers = existingInvoice.waybills.map((w) => w.waybill_number).join(', ');
      linkedParts.push(`waybills (${numbers})`);
    }

    if (linkedParts.length > 0) {
      const linkedList = linkedParts.join(' dan ');
      const deleteList = linkedParts.map((p) => p.split(' ')[0]).join(' dan ');
      throw new AppError(
        `Invoice tidak bisa didelete karena digunakan oleh ${linkedList}. ` +
        `Jika tetap ingin delete invoice, delete terlebih dahulu ${deleteList} terkait.`,
        400
      );
    }

    if (existingInvoice.generated_file_path) {
      documentGenerator.deleteFile(existingInvoice.generated_file_path);
    }

    await prisma.invoices.delete({ where: { id } });
    return true;
  },

  async getPaymentHistory(id: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) throw new AppError('Company not found or access denied', 404);

    const invoice = await prisma.invoices.findFirst({
      where: { id, company_id: companyId },
      select: { id: true, total_amount: true },
    });

    if (!invoice) throw new AppError('Invoice not found', 404);

    const payments = await prisma.invoice_payments.findMany({
      where: { invoice_id: id, company_id: companyId },
      orderBy: { payment_date: 'asc' },
    });

    const total_paid = payments.reduce((s, p) => s + Number(p.amount), 0);

    return { payments, total_paid, total_amount: Number(invoice.total_amount) };
  },

  async generate(id: number, companyId: number, userId: number) {
    const invoice = await this.findById(id, companyId, userId);

    const template = getDefaultInvoiceTemplate();

    const documentData: DocumentData = {
      company_name: (invoice.companies as any)?.name ?? '',
      company_address: [
        (invoice.companies as any)?.address,
        (invoice.companies as any)?.city,
        (invoice.companies as any)?.province,
      ].filter(Boolean).join(', '),
      company_phone: (invoice.companies as any)?.phone ?? '',
      company_email: (invoice.companies as any)?.email ?? '',
      company_logo: this.resolveLogoToBase64((invoice.companies as any)?.logo_url),
      document_number: invoice.invoice_number,
      date: invoice.invoice_date.toISOString(),
      due_date: invoice.due_date?.toISOString(),
      customer_name: (invoice.customers as any)?.name ?? '',
      customer_company: (invoice.customers as any)?.company_name ?? '',
      customer_address: [
        (invoice.customers as any)?.address,
        (invoice.customers as any)?.city,
        (invoice.customers as any)?.province,
      ].filter(Boolean).join(', '),
      customer_phone: (invoice.customers as any)?.phone ?? '',
      po_number: invoice.po_number ?? undefined,
      items: invoice.invoice_items.map((item) => ({
        name: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unit: item.unit ?? 'pcs',
        unit_price: Number(item.unit_price),
        discount: Number(item.discount_amount) || undefined,
        total_price: Number(item.total_price),
        total: Number(item.total_price),
      })),
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount_amount) || undefined,
      shipping: Number(invoice.shipping_cost) || undefined,
      tax: Number(invoice.tax_amount) || undefined,
      total: Number(invoice.total_amount),
      notes: invoice.notes ?? undefined,
      payment_history: invoice.invoice_payments.map((p, i) => ({
        receipt_number: `Pembayaran ${i + 1}`,
        date: p.payment_date,
        amount: Number(p.amount),
        payment_method: p.payment_method,
        status: p.notes ?? '',
      })),
    };

    const htmlContent = documentGenerator.generateFromTemplate(template, documentData);

    const fileName = `invoice-${invoice.invoice_number.replace(/[/\\]/g, '-')}.pdf`;

    await documentGenerator.generatePdf(htmlContent, fileName);

    await prisma.invoices.update({
      where: { id },
      data: { generated_file_path: fileName, updated_at: new Date() },
    });

    return { fileName };
  },

  async getFilePath(id: number, companyId: number, userId: number) {
    const invoice = await this.findById(id, companyId, userId);

    if (!invoice.generated_file_path) {
      throw new AppError('Invoice document not generated yet', 400);
    }

    return documentGenerator.getFilePath(invoice.generated_file_path);
  },

  async generateInvoiceNumber(
    companyId: number,
    settings?: { invoice_prefix?: string | null } | null
  ) {
    const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const prefix = settings?.invoice_prefix || 'AAJ';
    const now = new Date();
    const year = now.getFullYear().toString();
    const monthAbbr = MONTHS[now.getMonth()];

    const pattern = `INVOICE/${prefix}/${monthAbbr}/${year}/`;

    const last = await prisma.invoices.findFirst({
      where: { company_id: companyId, invoice_number: { startsWith: pattern } },
      orderBy: { id: 'desc' },
      select: { invoice_number: true },
    });

    let nextSeq = 1;
    if (last) {
      const parts = last.invoice_number.split('/');
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq)) nextSeq = seq + 1;
    }

    return `${pattern}${nextSeq.toString().padStart(4, '0')}`;
  },

  async recalculateTotals(invoiceId: number, companyId: number) {
    const [payments, invoice] = await Promise.all([
      prisma.invoice_payments.findMany({
        where: { invoice_id: invoiceId, company_id: companyId },
        select: { amount: true },
      }),
      prisma.invoices.findFirst({
        where: { id: invoiceId, company_id: companyId },
        select: { total_amount: true },
      }),
    ]);

    if (!invoice) return;

    const totalPaid = payments.reduce((s, p) => s + Number(p.amount), 0);
    const totalAmount = Number(invoice.total_amount);

    let paymentStatus: invoices_payment_status;
    if (totalPaid >= totalAmount && totalAmount > 0) {
      paymentStatus = 'lunas';
    } else if (totalPaid > 0) {
      paymentStatus = 'dp';
    } else {
      paymentStatus = 'belum_bayar';
    }

    await prisma.invoices.update({
      where: { id: invoiceId },
      data: { total_paid: totalPaid, payment_status: paymentStatus, updated_at: new Date() },
    });
  },

  async addPayment(invoiceId: number, companyId: number, userId: number, data: CreatePaymentDto) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });
    if (!company) throw new AppError('Company not found or access denied', 404);

    const invoice = await prisma.invoices.findFirst({
      where: { id: invoiceId, company_id: companyId },
    });
    if (!invoice) throw new AppError('Invoice not found', 404);

    const payment = await prisma.invoice_payments.create({
      data: {
        invoice_id: invoiceId,
        company_id: companyId,
        payment_date: new Date(data.payment_date),
        amount: data.amount,
        payment_method: data.payment_method as receipts_payment_method,
        notes: data.notes ?? null,
        created_by: userId,
      },
    });

    await this.recalculateTotals(invoiceId, companyId);

    return payment;
  },

  async updatePayment(
    invoiceId: number,
    paymentId: number,
    companyId: number,
    userId: number,
    data: UpdatePaymentDto
  ) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });
    if (!company) throw new AppError('Company not found or access denied', 404);

    const existing = await prisma.invoice_payments.findFirst({
      where: { id: paymentId, invoice_id: invoiceId, company_id: companyId },
    });
    if (!existing) throw new AppError('Payment not found', 404);

    const payment = await prisma.invoice_payments.update({
      where: { id: paymentId },
      data: {
        payment_date: data.payment_date ? new Date(data.payment_date) : undefined,
        amount: data.amount,
        payment_method: data.payment_method as receipts_payment_method | undefined,
        notes: data.notes,
        updated_at: new Date(),
      },
    });

    await this.recalculateTotals(invoiceId, companyId);

    return payment;
  },

  async deletePayment(invoiceId: number, paymentId: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });
    if (!company) throw new AppError('Company not found or access denied', 404);

    const existing = await prisma.invoice_payments.findFirst({
      where: { id: paymentId, invoice_id: invoiceId, company_id: companyId },
    });
    if (!existing) throw new AppError('Payment not found', 404);

    await prisma.invoice_payments.delete({ where: { id: paymentId } });
    await this.recalculateTotals(invoiceId, companyId);

    return true;
  },

  resolveLogoToBase64(logoUrl?: string | null): string | undefined {
    if (!logoUrl) return undefined;

    const fileName = logoUrl.split('/').pop();
    if (!fileName) return undefined;

    const logoPath = path.join(storageConfig.companyLogosPath, fileName);
    if (!fs.existsSync(logoPath)) return undefined;

    const buffer = fs.readFileSync(logoPath);
    const ext = path.extname(fileName).toLowerCase().replace('.', '');
    const mime = ext === 'jpg' ? 'image/jpeg' : `image/${ext}`;
    return `data:${mime};base64,${buffer.toString('base64')}`;
  },
};
