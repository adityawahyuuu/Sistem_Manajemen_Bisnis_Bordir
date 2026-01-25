import { prisma } from '../../../database/prisma.client';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../interfaces/invoice.interface';
import { AppError } from '../../../middleware';
import { documentGenerator } from '../../../shared/utils/document.generator.util';
import { invoices_status } from '../../../../prisma/generated/prisma';
import { TemplateSchema } from '../../templates/interfaces/template.interface';

export const invoiceService = {
  /**
   * Get all invoices for a company (per company)
   */
  async findAllByCompany(
    companyId: number,
    userId: number,
    page = 1,
    limit = 10,
    status?: invoices_status,
    customerId?: number,
    search?: string
  ) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const where: Record<string, unknown> = {
      company_id: companyId,
      ...(status && { status }),
      ...(customerId && { customer_id: customerId }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search } },
          { customers: { name: { contains: search } } },
          { customers: { company_name: { contains: search } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          invoice_items: true,
          customers: {
            select: {
              id: true,
              name: true,
              company_name: true,
            },
          },
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.invoices.count({ where }),
    ]);

    return { data: invoices, total };
  },

  /**
   * Get all invoices for a user (across all companies)
   */
  async findAllByUser(
    userId: number,
    page = 1,
    limit = 10,
    status?: invoices_status,
    search?: string
  ) {
    // Get all user's companies
    const userCompanies = await prisma.companies.findMany({
      where: { user_id: userId, deleted_at: null },
      select: { id: true },
    });

    const companyIds = userCompanies.map((c) => c.id);

    if (companyIds.length === 0) {
      return { data: [], total: 0 };
    }

    const where: Record<string, unknown> = {
      company_id: { in: companyIds },
      ...(status && { status }),
      ...(search && {
        OR: [
          { invoice_number: { contains: search } },
          { customers: { name: { contains: search } } },
        ],
      }),
    };

    const [invoices, total] = await Promise.all([
      prisma.invoices.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { created_at: 'desc' },
        include: {
          invoice_items: true,
          customers: {
            select: {
              id: true,
              name: true,
              company_name: true,
            },
          },
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.invoices.count({ where }),
    ]);

    return { data: invoices, total };
  },

  /**
   * Get invoice by ID
   */
  async findById(id: number, companyId: number, userId: number) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    const invoice = await prisma.invoices.findFirst({
      where: { id, company_id: companyId },
      include: {
        invoice_items: true,
        customers: true,
        companies: {
          include: {
            company_settings: true,
          },
        },
        users: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!invoice) {
      throw new AppError('Invoice not found', 404);
    }

    return invoice;
  },

  /**
   * Create new invoice
   */
  async create(companyId: number, userId: number, data: CreateInvoiceDto) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
      include: { company_settings: true },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    // Verify customer belongs to company
    const customer = await prisma.customers.findFirst({
      where: { id: data.customer_id, company_id: companyId },
    });

    if (!customer) {
      throw new AppError('Customer not found or does not belong to this company', 404);
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(companyId, company.company_settings);

    // Calculate totals
    const subtotal = data.items.reduce((sum, item) => {
      return sum + item.quantity * item.unit_price;
    }, 0);

    const taxAmount = data.tax_amount || 0;
    const discountAmount = data.discount_amount || 0;
    const totalAmount = subtotal + taxAmount - discountAmount;

    // Create invoice with items
    const invoice = await prisma.invoices.create({
      data: {
        company_id: companyId,
        customer_id: data.customer_id,
        invoice_number: invoiceNumber,
        invoice_date: data.invoice_date ? new Date(data.invoice_date) : new Date(),
        due_date: data.due_date ? new Date(data.due_date) : null,
        subtotal,
        tax_amount: taxAmount,
        discount_amount: discountAmount,
        total_amount: totalAmount,
        status: 'draft',
        notes: data.notes || null,
        created_by: userId,
        invoice_items: {
          create: data.items.map((item) => ({
            item_id: item.item_id,
            item_name: item.name,
            description: item.description || null,
            quantity: item.quantity,
            unit_price: item.unit_price,
            total_price: item.quantity * item.unit_price,
          })),
        },
      },
      include: {
        invoice_items: true,
        customers: true,
      },
    });

    return invoice;
  },

  /**
   * Update invoice
   */
  async update(id: number, companyId: number, userId: number, data: UpdateInvoiceDto) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    // Verify invoice belongs to company
    const existingInvoice = await prisma.invoices.findFirst({
      where: { id, company_id: companyId },
      include: { invoice_items: true },
    });

    if (!existingInvoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Prevent updating cancelled or paid invoices (except status change to cancelled)
    if (existingInvoice.status === 'cancelled') {
      throw new AppError('Cannot update cancelled invoice', 400);
    }

    if (existingInvoice.status === 'paid' && data.status !== 'cancelled') {
      throw new AppError('Cannot update paid invoice except to cancel', 400);
    }

    // Calculate new subtotal if items are provided
    let subtotal = Number(existingInvoice.subtotal);
    if (data.items && data.items.length > 0) {
      subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
    }

    const taxAmount = data.tax_amount ?? Number(existingInvoice.tax_amount);
    const discountAmount = data.discount_amount ?? Number(existingInvoice.discount_amount);
    const totalAmount = subtotal + taxAmount - discountAmount;

    const invoice = await prisma.$transaction(async (tx) => {
      // Delete existing items if new items provided
      if (data.items && data.items.length > 0) {
        await tx.invoice_items.deleteMany({
          where: { invoice_id: id },
        });
      }

      // Update invoice
      return tx.invoices.update({
        where: { id },
        data: {
          due_date: data.due_date ? new Date(data.due_date) : undefined,
          tax_amount: taxAmount,
          discount_amount: discountAmount,
          subtotal: data.items ? subtotal : undefined,
          total_amount: totalAmount,
          notes: data.notes,
          status: data.status as invoices_status,
          updated_at: new Date(),
          // Create new items if provided
          ...(data.items && data.items.length > 0
            ? {
                invoice_items: {
                  create: data.items.map((item) => ({
                    item_id: item.item_id,
                    item_name: item.name,
                    description: item.description || null,
                    quantity: item.quantity,
                    unit_price: item.unit_price,
                    total_price: item.quantity * item.unit_price,
                  })),
                },
              }
            : {}),
        },
        include: {
          invoice_items: true,
          customers: true,
          companies: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });
    });

    return invoice;
  },

  /**
   * Delete invoice
   */
  async delete(id: number, companyId: number, userId: number) {
    // Verify company ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    // Verify invoice belongs to company
    const existingInvoice = await prisma.invoices.findFirst({
      where: { id, company_id: companyId },
      include: { receipts: true, waybills: true },
    });

    if (!existingInvoice) {
      throw new AppError('Invoice not found', 404);
    }

    // Prevent deletion if invoice has receipts or waybills
    if (existingInvoice.receipts.length > 0) {
      throw new AppError('Cannot delete invoice with linked receipts', 400);
    }

    if (existingInvoice.waybills.length > 0) {
      throw new AppError('Cannot delete invoice with linked waybills', 400);
    }

    // Delete generated file if exists
    if (existingInvoice.generated_file_path) {
      documentGenerator.deleteFile(existingInvoice.generated_file_path);
    }

    // Delete invoice (cascade will delete invoice_items via onDelete: Cascade in schema)
    await prisma.invoices.delete({ where: { id } });

    return true;
  },

  /**
   * Generate PDF for invoice
   * @param id - Invoice ID
   * @param companyId - Company ID
   * @param userId - User ID
   * @param templateId - Optional template ID (if not provided, uses default template or legacy method)
   */
  async generate(id: number, companyId: number, userId: number, templateId?: number) {
    const invoice = await this.findById(id, companyId, userId);
    const documentData = {
    company: {
        name: invoice.companies?.name ?? '',
        address: [
          invoice.companies?.address,
          invoice.companies?.city,
          invoice.companies?.province,
        ].filter(Boolean).join(', '),
        phone: invoice.companies?.phone ?? '',
        email: invoice.companies?.email ?? '',
        logo_url: invoice.companies?.company_settings?.logo_url,
        primary_color: invoice.companies?.company_settings?.primary_color,
      },
      document: {
        number: invoice.invoice_number,
        date: invoice.invoice_date.toISOString(),
        due_date: invoice.due_date?.toISOString(),
        status: invoice.status,
      },
      customer: {
        name: invoice.customers?.name ?? '',
        company: invoice.customers?.company_name ?? '',
        address: [
          invoice.customers?.address,
          invoice.customers?.city,
          invoice.customers?.province,
        ].filter(Boolean).join(', '),
        phone: invoice.customers?.phone ?? '',
      },
      items: invoice.invoice_items.map(item => ({
        name: item.item_name,
        description: item.description,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        total_price: Number(item.total_price),
      })),
      totals: {
        subtotal: Number(invoice.subtotal),
        discount: Number(invoice.discount_amount) || undefined,
        tax: Number(invoice.tax_amount) || undefined,
        total: Number(invoice.total_amount),
      },
      notes: invoice.notes ?? undefined,
    };

    let template;

    if (templateId) {
      // Find specific template by ID
      template = await prisma.document_templates.findFirst({
        where: {
          id: templateId,
          document_type: 'invoice',
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
          document_type: 'invoice',
          status: 'published',
          deleted_at: null,
          OR: [
            { company_id: companyId, is_default: true },
            { is_system: true },
          ],
        },
        orderBy: [
          { company_id: 'desc' }, // Prefer company template over system
          { is_default: 'desc' }, // Prefer default template
        ],
      });

      if (!template) {
        throw new AppError('No published template available. Please create and publish a template first.', 404);
      }
    }

    const templateSchema = template.template_schema as unknown as TemplateSchema;

    const htmlContent = documentGenerator.generateFromTemplate(
      templateSchema,
      documentData
    );

    const fileName = `document-${invoice.invoice_number.replace(/[/\\]/g, '-')}.pdf`;

    await documentGenerator.generatePdf(htmlContent, fileName);

    await prisma.invoices.update({
      where: { id },
      data: {
        generated_file_path: fileName,
        updated_at: new Date(),
      },
    });

    return {
      fileName,
    };
  },

  /**
   * Get file path for download
   */
  async getFilePath(id: number, companyId: number, userId: number) {
    const invoice = await this.findById(id, companyId, userId);

    if (!invoice.generated_file_path) {
      throw new AppError('Invoice document not generated yet', 400);
    }

    return documentGenerator.getFilePath(invoice.generated_file_path);
  },

  /**
   * Generate invoice number based on company settings
   */
  async generateInvoiceNumber(
    companyId: number,
    settings?: { invoice_prefix?: string | null; invoice_number_format?: string | null } | null
  ) {
    const prefix = settings?.invoice_prefix || 'INV';
    const format = settings?.invoice_number_format || '{PREFIX}-{YEAR}{MONTH}-{NUMBER}';

    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    // Get count of invoices this month for this company
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.invoices.count({
      where: {
        company_id: companyId,
        created_at: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
      },
    });

    const number = (count + 1).toString().padStart(4, '0');

    // Replace placeholders
    return format
      .replace('{PREFIX}', prefix)
      .replace('{YEAR}', year)
      .replace('{MONTH}', month)
      .replace('{NUMBER}', number);
  },

  /**
   * Update invoice status
   */
  async updateStatus(id: number, companyId: number, userId: number, status: invoices_status) {
    return this.update(id, companyId, userId, { status });
  },
};
