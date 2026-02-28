import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../../../database/prisma.client';
import { CreateReceiptDto, UpdateReceiptDto } from '../interfaces/receipt.interface';
import { AppError } from '../../../middleware';
import { documentGenerator } from '../../../shared/utils/document.generator.util';
import { receipts_payment_method, receipts_status } from '../../../../prisma/generated/prisma';
import { getDefaultReceiptTemplate } from '../../../shared/utils/html-builder.util';
import { storageConfig } from '../../../config/app.config';

export const receiptService = {
  async findAllByCompany(
    companyId: number,
    userId: number,
    page = 1,
    limit = 10,
    customerId?: number,
    invoiceId?: number,
    paymentMethod?: receipts_payment_method,
    status?: receipts_status,
    search?: string
  ) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const where: Record<string, unknown> = {
      company_id: companyId,
      ...(customerId && { customer_id: customerId }),
      ...(invoiceId && { invoice_id: invoiceId }),
      ...(paymentMethod && { payment_method: paymentMethod }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { receipt_number: { contains: search } },
          { customers: { name: { contains: search } } },
        ],
      }),
    };

    const [receipts, total] = await Promise.all([
      prisma.receipts.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customers: { select: { id: true, name: true, company_name: true } },
          invoices: { select: { id: true, invoice_number: true } },
        },
      }),
      prisma.receipts.count({ where }),
    ]);

    return { data: receipts, total };
  },

  async findById(id: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const receipt = await prisma.receipts.findFirst({
      where: { id, company_id: companyId },
      include: {
        customers: true,
        invoices: true,
        companies: { include: { company_settings: true } },
      },
    });

    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    return receipt;
  },

  async create(companyId: number, userId: number, data: CreateReceiptDto) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
      include: { company_settings: true },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const customer = await prisma.customers.findFirst({
      where: { id: data.customer_id, company_id: companyId },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    const invoice = await prisma.invoices.findFirst({
      where: { id: data.invoice_id, company_id: companyId },
    });
    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    const receiptNumber = await this.generateReceiptNumber(companyId, company.company_settings);

    const receiptBaseData = {
      company_id: companyId,
      customer_id: data.customer_id,
      invoice_id: data.invoice_id,
      receipt_date: data.receipt_date ? new Date(data.receipt_date) : new Date(),
      amount: data.amount,
      payment_method: (data.payment_method || 'cash') as receipts_payment_method,
      status: (data.status || 'dp') as receipts_status,
      description: data.description || null,
      received_by: data.received_by || null,
      notes: data.notes || null,
      created_by: userId,
    };

    const doCreate = (number: string) =>
      prisma.receipts.create({
        data: { ...receiptBaseData, receipt_number: number },
        include: { customers: true, invoices: true },
      });

    let receipt;
    try {
      receipt = await doCreate(receiptNumber);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const retryNumber = await this.generateReceiptNumber(companyId, company.company_settings);
        receipt = await doCreate(retryNumber);
      } else {
        throw err;
      }
    }

    return receipt;
  },

  async update(id: number, companyId: number, userId: number, data: UpdateReceiptDto) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const existingReceipt = await prisma.receipts.findFirst({
      where: { id, company_id: companyId },
    });

    if (!existingReceipt) {
      throw new AppError('Receipt not found', 404);
    }

    const receipt = await prisma.receipts.update({
      where: { id },
      data: {
        amount: data.amount,
        payment_method: data.payment_method as receipts_payment_method,
        status: data.status as receipts_status,
        description: data.description,
        received_by: data.received_by,
        notes: data.notes,
        updated_at: new Date(),
      },
      include: { customers: true, invoices: true },
    });

    return receipt;
  },

  async delete(id: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const existingReceipt = await prisma.receipts.findFirst({
      where: { id, company_id: companyId },
    });

    if (!existingReceipt) {
      throw new AppError('Receipt not found', 404);
    }

    if (existingReceipt.generated_file_path) {
      documentGenerator.deleteFile(existingReceipt.generated_file_path);
    }

    await prisma.receipts.delete({ where: { id } });

    return true;
  },

  async generate(
    id: number,
    companyId: number,
    userId: number
  ) {
    const receipt = await this.findById(id, companyId, userId);

    const template = getDefaultReceiptTemplate();

    const documentData = {
      company_name: receipt.companies?.name ?? '',
      company_address: [
        receipt.companies?.address,
        receipt.companies?.city,
        receipt.companies?.province,
      ].filter(Boolean).join(', '),
      company_phone: receipt.companies?.phone ?? '',
      company_email: receipt.companies?.email ?? '',
      company_logo: this.resolveLogoToBase64(receipt.companies?.logo_url),
      document_number: receipt.receipt_number,
      date: receipt.receipt_date?.toISOString(),
      customer_name: receipt.customers?.name ?? '',
      customer_company: receipt.customers?.company_name ?? '',
      customer_address: [
        receipt.customers?.address,
        receipt.customers?.city_code,
        receipt.customers?.province_code,
      ].filter(Boolean).join(', '),
      customer_phone: receipt.customers?.phone ?? '',
      amount: Number(receipt.amount),
      payment_method: receipt.payment_method,
      description: receipt.description ?? undefined,
      received_by: receipt.received_by ?? undefined,
      notes: receipt.notes ?? undefined,
    };

    const htmlContent = documentGenerator.generateFromTemplate(template, documentData);

    // 4. Generate PDF
    const fileName = `receipt-${receipt.receipt_number.replace(/[/\\]/g, '-')}.pdf`;

    await documentGenerator.generatePdf(htmlContent, fileName);

    // 5. Persist hasil
    await prisma.receipts.update({
      where: { id },
      data: {
        generated_file_path: fileName,
        updated_at: new Date(),
      },
    });

    return {
      fileName,
      receipt: {
        ...receipt,
        generated_file_path: fileName,
      },
    };
  },

  async getFilePath(id: number, companyId: number, userId: number) {
    const receipt = await this.findById(id, companyId, userId);

    if (!receipt.generated_file_path) {
      throw new AppError('Receipt document not generated yet', 400);
    }

    return documentGenerator.getFilePath(receipt.generated_file_path);
  },

  async generateReceiptNumber(
    companyId: number,
    settings?: { invoice_prefix?: string | null } | null
  ) {
    const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const prefix = settings?.invoice_prefix || 'AAJ';
    const now = new Date();
    const year = now.getFullYear().toString();
    const monthAbbr = MONTHS[now.getMonth()];

    const pattern = `KUITANSI/${prefix}/${monthAbbr}/${year}/`;

    const last = await prisma.receipts.findFirst({
      where: { company_id: companyId, receipt_number: { startsWith: pattern } },
      orderBy: { id: 'desc' },
      select: { receipt_number: true },
    });

    let nextSeq = 1;
    if (last) {
      const parts = last.receipt_number.split('/');
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq)) nextSeq = seq + 1;
    }

    return `${pattern}${nextSeq.toString().padStart(4, '0')}`;
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
