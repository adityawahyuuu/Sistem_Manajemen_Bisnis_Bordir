import { prisma } from '../../../database/prisma.client';
import { CreateInvoiceDto, UpdateInvoiceDto } from '../interfaces/invoice.interface';
import { AppError } from '../../../middleware';
import { documentGenerator } from '../../../shared/utils/document.generator';
import { invoices_status } from '../../../../prisma/generated/prisma';

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
          customers: {
            select: {
              id: true,
              name: true,
              company_name: true,
            },
          },
          _count: {
            select: { invoice_items: true },
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
          _count: {
            select: { invoice_items: true },
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

    const invoice = await prisma.invoices.update({
      where: { id },
      data: {
        due_date: data.due_date ? new Date(data.due_date) : undefined,
        tax_amount: data.tax_amount,
        discount_amount: data.discount_amount,
        notes: data.notes,
        status: data.status as invoices_status,
        // Recalculate total if tax or discount changed
        ...(data.tax_amount !== undefined || data.discount_amount !== undefined
          ? {
              total_amount:
                Number(existingInvoice.subtotal) +
                (data.tax_amount ?? Number(existingInvoice.tax_amount)) -
                (data.discount_amount ?? Number(existingInvoice.discount_amount)),
            }
          : {}),
        updated_at: new Date(),
      },
      include: {
        invoice_items: true,
        customers: true,
      },
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

    // Delete invoice (cascade will delete invoice_items)
    await prisma.invoices.delete({ where: { id } });

    return true;
  },

  /**
   * Generate PDF for invoice
   */
  async generate(id: number, companyId: number, userId: number) {
    const invoice = await this.findById(id, companyId, userId);

    // Prepare document data
    const documentData = {
      // Company info
      company_name: invoice.companies?.name || '',
      company_address: [
        invoice.companies?.address,
        invoice.companies?.city,
        invoice.companies?.province,
      ]
        .filter(Boolean)
        .join(', '),
      company_phone: invoice.companies?.phone || '',
      company_email: invoice.companies?.email || '',
      company_logo: invoice.companies?.company_settings?.logo_url || null,
      primary_color: invoice.companies?.company_settings?.primary_color || '#000000',
      // Invoice info
      invoice_number: invoice.invoice_number,
      date:
        invoice.invoice_date instanceof Date
          ? invoice.invoice_date.toLocaleDateString('id-ID')
          : new Date(invoice.invoice_date).toLocaleDateString('id-ID'),
      due_date: invoice.due_date
        ? invoice.due_date instanceof Date
          ? invoice.due_date.toLocaleDateString('id-ID')
          : new Date(invoice.due_date).toLocaleDateString('id-ID')
        : '-',
      status: invoice.status,
      // Customer info
      customer_name: invoice.customers?.name || '',
      customer_company: invoice.customers?.company_name || '',
      customer_address: [
        invoice.customers?.address,
        invoice.customers?.city,
        invoice.customers?.province,
      ]
        .filter(Boolean)
        .join(', '),
      customer_phone: invoice.customers?.phone || '',
      // Items
      items: invoice.invoice_items.map((item) => ({
        description: item.item_name + (item.description ? ` - ${item.description}` : ''),
        quantity: item.quantity,
        unit: 'pcs',
        unit_price: Number(item.unit_price),
        total: Number(item.total_price),
      })),
      // Totals
      subtotal: Number(invoice.subtotal),
      discount: Number(invoice.discount_amount),
      tax: Number(invoice.tax_amount),
      total: Number(invoice.total_amount),
      notes: invoice.notes || '',
      // Settings
      terms_conditions: invoice.companies?.company_settings?.terms_conditions || '',
      footer_text: invoice.companies?.company_settings?.footer_text || '',
      show_tax_column: invoice.companies?.company_settings?.show_tax_column ?? true,
      show_discount_column: invoice.companies?.company_settings?.show_discount_column ?? true,
    };

    // Generate PDF
    const htmlContent = documentGenerator.generateInvoiceHtml(documentData);
    const fileName = `invoice-${invoice.invoice_number.replace(/[/\\]/g, '-')}.pdf`;
    await documentGenerator.generatePdf(htmlContent, fileName);

    // Update invoice with file path
    await prisma.invoices.update({
      where: { id },
      data: {
        generated_file_path: fileName,
        updated_at: new Date(),
      },
    });

    return {
      fileName,
      invoice: { ...invoice, generated_file_path: fileName },
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
