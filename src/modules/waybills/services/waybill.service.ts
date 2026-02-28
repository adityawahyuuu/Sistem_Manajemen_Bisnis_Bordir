import * as fs from 'fs';
import * as path from 'path';
import { prisma } from '../../../database/prisma.client';
import { CreateWaybillDto, UpdateWaybillDto } from '../interfaces/waybill.interface';
import { AppError } from '../../../middleware';
import { documentGenerator } from '../../../shared/utils/document.generator.util';
import { waybills_status } from '../../../../prisma/generated/prisma';
import { getDefaultWaybillTemplate } from '../../../shared/utils/html-builder.util';
import { storageConfig } from '../../../config/app.config';

export const waybillService = {
  async findAllByCompany(
    companyId: number,
    userId: number,
    page = 1,
    limit = 10,
    customerId?: number,
    invoiceId?: number,
    status?: waybills_status,
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
      ...(status && { status }),
      ...(search && {
        OR: [
          { waybill_number: { contains: search } },
          { customers: { name: { contains: search } } },
          { expedition_name: { contains: search } },
        ],
      }),
    };

    const [waybills, total] = await Promise.all([
      prisma.waybills.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          customers: { select: { id: true, name: true, company_name: true } },
          invoices: { select: { id: true, invoice_number: true } },
          _count: { select: { waybill_items: true } },
        },
      }),
      prisma.waybills.count({ where }),
    ]);

    return { data: waybills, total };
  },

  async findById(id: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const waybill = await prisma.waybills.findFirst({
      where: { id, company_id: companyId },
      include: {
        waybill_items: true,
        customers: true,
        invoices: true,
        companies: { include: { company_settings: true } },
      },
    });

    if (!waybill) {
      throw new AppError('Waybill not found', 404);
    }

    return waybill;
  },

  async create(companyId: number, userId: number, data: CreateWaybillDto) {
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
      include: { invoice_items: true },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Auto-populate items from invoice if not provided
    const items = (data.items && data.items.length > 0)
      ? data.items
      : invoice.invoice_items.map((item) => ({
          name: item.item_name,
          quantity: Number(item.quantity),
          unit: 'pcs',
          notes: item.description || '',
        }));

    const waybillNumber = await this.generateWaybillNumber(companyId, company.company_settings);

    const waybillBaseData = {
      company_id: companyId,
      customer_id: data.customer_id,
      invoice_id: data.invoice_id,
      waybill_date: data.waybill_date ? new Date(data.waybill_date) : new Date(),
      destination_address: data.destination_address || customer.address || '',
      destination_city: data.destination_city || customer.city_code || '',
      destination_province: data.destination_province || customer.province_code || '',
      expedition_name: data.expedition_name || null,
      vehicle_number: data.vehicle_number || null,
      driver_name: data.driver_name || null,
      notes: data.notes || null,
      status: 'pending' as const,
      created_by: userId,
    };

    const itemsData = items.map((item) => ({
      item_name: item.name,
      quantity: item.quantity,
      unit: item.unit || 'pcs',
      notes: item.notes || null,
    }));

    const doCreate = (number: string) =>
      prisma.waybills.create({
        data: { ...waybillBaseData, waybill_number: number, waybill_items: { create: itemsData } },
        include: { waybill_items: true, customers: true, invoices: true },
      });

    try {
      return await doCreate(waybillNumber);
    } catch (err: any) {
      if (err?.code === 'P2002') {
        const retryNumber = await this.generateWaybillNumber(companyId, company.company_settings);
        return doCreate(retryNumber);
      }
      throw err;
    }
  },

  async update(id: number, companyId: number, userId: number, data: UpdateWaybillDto) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const existingWaybill = await prisma.waybills.findFirst({
      where: { id, company_id: companyId },
    });

    if (!existingWaybill) {
      throw new AppError('Waybill not found', 404);
    }

    if (existingWaybill.status === 'delivered') {
      throw new AppError('Cannot update delivered waybill', 400);
    }

    const waybill = await prisma.waybills.update({
      where: { id },
      data: {
        destination_address: data.destination_address,
        destination_city: data.destination_city,
        destination_province: data.destination_province,
        expedition_name: data.expedition_name,
        vehicle_number: data.vehicle_number,
        driver_name: data.driver_name,
        notes: data.notes,
        status: data.status as waybills_status,
        updated_at: new Date(),
      },
      include: { waybill_items: true, customers: true, invoices: true },
    });

    return waybill;
  },

  async delete(id: number, companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const existingWaybill = await prisma.waybills.findFirst({
      where: { id, company_id: companyId },
    });

    if (!existingWaybill) {
      throw new AppError('Waybill not found', 404);
    }

    if (existingWaybill.generated_file_path) {
      documentGenerator.deleteFile(existingWaybill.generated_file_path);
    }

    await prisma.waybills.delete({ where: { id } });

    return true;
  },

  async generate(
    id: number,
    companyId: number,
    userId: number
  ) {
    const waybill = await this.findById(id, companyId, userId);

    const template = getDefaultWaybillTemplate();

    const documentData = {
      company_name: waybill.companies?.name ?? '',
      company_address: [waybill.companies?.address, waybill.companies?.city, waybill.companies?.province]
        .filter(Boolean)
        .join(', '),
      company_phone: waybill.companies?.phone ?? '',
      company_email: waybill.companies?.email ?? '',
      company_logo: this.resolveLogoToBase64(waybill.companies?.logo_url),
      document_number: waybill.waybill_number,
      date: waybill.waybill_date?.toISOString(),
      customer_name: waybill.customers?.name ?? '',
      customer_company: waybill.customers?.company_name ?? '',
      customer_address: [
        waybill.destination_address,
        waybill.destination_city,
        waybill.destination_province,
      ].filter(Boolean).join(', '),
      customer_phone: waybill.customers?.phone ?? '',
      expedition_name: waybill.expedition_name ?? undefined,
      vehicle_number: waybill.vehicle_number ?? undefined,
      driver_name: waybill.driver_name ?? undefined,
      items: waybill.waybill_items.map((item) => ({
        description: item.item_name,
        quantity: Number(item.quantity),
        unit: item.unit ?? 'pcs',
        notes: item.notes ?? '',
      })),
      notes: waybill.notes ?? undefined,
    };

    const htmlContent = documentGenerator.generateFromTemplate(template, documentData);

    const fileName = `waybill-${waybill.waybill_number.replace(/[/\\]/g, '-')}.pdf`;

    await documentGenerator.generatePdf(htmlContent, fileName);

    await prisma.waybills.update({
      where: { id },
      data: {
        generated_file_path: fileName,
        updated_at: new Date(),
      },
    });

    return {
      fileName,
      waybill: { ...waybill, generated_file_path: fileName },
    };
  },

  async getFilePath(id: number, companyId: number, userId: number) {
    const waybill = await this.findById(id, companyId, userId);

    if (!waybill.generated_file_path) {
      throw new AppError('Waybill document not generated yet', 400);
    }

    return documentGenerator.getFilePath(waybill.generated_file_path);
  },

  async generateWaybillNumber(
    companyId: number,
    settings?: { invoice_prefix?: string | null } | null
  ) {
    const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
    const prefix = settings?.invoice_prefix || 'AAJ';
    const now = new Date();
    const year = now.getFullYear().toString();
    const monthAbbr = MONTHS[now.getMonth()];

    const pattern = `SURATJALAN/${prefix}/${monthAbbr}/${year}/`;

    const last = await prisma.waybills.findFirst({
      where: { company_id: companyId, waybill_number: { startsWith: pattern } },
      orderBy: { id: 'desc' },
      select: { waybill_number: true },
    });

    let nextSeq = 1;
    if (last) {
      const parts = last.waybill_number.split('/');
      const seq = parseInt(parts[parts.length - 1], 10);
      if (!isNaN(seq)) nextSeq = seq + 1;
    }

    return `${pattern}${nextSeq.toString().padStart(4, '0')}`;
  },

  async updateStatus(id: number, companyId: number, userId: number, status: waybills_status) {
    return this.update(id, companyId, userId, { status });
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
