import { prisma } from '../../../database/prisma.client';
import { CreateWaybillDto, UpdateWaybillDto } from '../interfaces/waybill.interface';
import { AppError } from '../../../middleware';
import { documentGenerator } from '../../../shared/utils/document.generator.util';
import { waybills_status } from '../../../../prisma/generated/prisma';
import { TemplateSchema } from '@/modules/templates/interfaces/template.interface';

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

    let items = data.items || [];

    // If invoice_id provided, get items from invoice
    if (data.invoice_id) {
      const invoice = await prisma.invoices.findFirst({
        where: { id: data.invoice_id, company_id: companyId },
        include: { invoice_items: true },
      });

      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }

      if (!data.items || data.items.length === 0) {
        items = invoice.invoice_items.map((item) => ({
          name: item.item_name,
          quantity: Number(item.quantity),
          unit: 'pcs',
          notes: item.description || '',
        }));
      }
    }

    const waybillNumber = await this.generateWaybillNumber(companyId);

    const waybill = await prisma.waybills.create({
      data: {
        company_id: companyId,
        customer_id: data.customer_id,
        invoice_id: data.invoice_id || null,
        waybill_number: waybillNumber,
        waybill_date: data.waybill_date ? new Date(data.waybill_date) : new Date(),
        destination_address: data.destination_address || customer.address || '',
        destination_city: data.destination_city || customer.city || 'Tasikmalaya',
        destination_province: data.destination_province || customer.province || 'Jawa Barat',
        vehicle_number: data.vehicle_number || null,
        driver_name: data.driver_name || null,
        notes: data.notes || null,
        status: 'pending',
        created_by: userId,
        waybill_items: {
          create: items.map((item) => ({
            item_name: item.name,
            quantity: item.quantity,
            unit: item.unit || 'pcs',
            notes: item.notes || null,
          })),
        },
      },
      include: { waybill_items: true, customers: true, invoices: true },
    });

    return waybill;
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
    userId: number,
    templateId?: number
  ) {
    const waybill = await this.findById(id, companyId, userId);

    let template;

    if (templateId) {
      // Find specific template by ID
      template = await prisma.document_templates.findFirst({
        where: {
          id: templateId,
          document_type: 'waybill',
          deleted_at: null,
          OR: [{ company_id: companyId }, { is_system: true }],
        },
      });

      if (!template) {
        throw new AppError('Template not found', 404);
      }

      if (template.status !== 'published') {
        throw new AppError('Template must be published before use. Please publish the template first.', 400);
      }
    } else {
      // Find default template for company, or fallback to system template
      template = await prisma.document_templates.findFirst({
        where: {
          document_type: 'waybill',
          status: 'published',
          deleted_at: null,
          OR: [
            { company_id: companyId, is_default: true },
            { is_system: true },
          ],
        },
        orderBy: [
          { company_id: 'desc' },
          { is_default: 'desc' },
        ],
      });

      if (!template) {
        throw new AppError('No published template available. Please create and publish a template first.', 404);
      }
    }

    const documentData = {
      company: {
        name: waybill.companies?.name ?? '',
        address: [waybill.companies?.address, waybill.companies?.city, waybill.companies?.province]
          .filter(Boolean)
          .join(', '),
        phone: waybill.companies?.phone ?? undefined,
        theme: {
          primary_color:
            waybill.companies?.company_settings?.primary_color ?? '#333333',
        },
      },
      document: {
        number: waybill.waybill_number,
        date: waybill.waybill_date,
      },
      customer: {
        name: waybill.customers?.name ?? '',
        delivery_address: waybill.destination_address ?? '',
        delivery_city: waybill.destination_city ?? '',
        delivery_province: waybill.destination_province ?? '',
      },
      logistics: {
        vehicle_number: waybill.vehicle_number ?? undefined,
        driver_name: waybill.driver_name ?? undefined,
      },
      items: waybill.waybill_items.map((item) => ({
        description: item.item_name,
        quantity: Number(item.quantity),
        unit: item.unit ?? 'pcs',
      })),
      reference: {
        invoice_number: waybill.invoices?.invoice_number ?? undefined,
      },
      notes: waybill.notes ?? undefined,
    };

    const htmlContent = documentGenerator.generateFromTemplate(
      template.template_schema as unknown as TemplateSchema,
      documentData
    );

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

  async generateWaybillNumber(companyId: number) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.waybills.count({
      where: {
        company_id: companyId,
        created_at: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const number = (count + 1).toString().padStart(4, '0');
    return `SJ-${year}${month}-${number}`;
  },

  async updateStatus(id: number, companyId: number, userId: number, status: waybills_status) {
    return this.update(id, companyId, userId, { status });
  },
};
