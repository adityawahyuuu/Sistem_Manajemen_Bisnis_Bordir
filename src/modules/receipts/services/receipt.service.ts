import { prisma } from '../../../database/prisma.client';
import { CreateReceiptDto, UpdateReceiptDto } from '../interfaces/receipt.interface';
import { AppError } from '../../../middleware';
import { documentGenerator } from '../../../shared/utils/document.generator.util';
import { receipts_payment_method } from '../../../../prisma/generated/prisma';
import { TemplateSchema } from '@/modules/templates/interfaces/template.interface';

export const receiptService = {
  async findAllByCompany(
    companyId: number,
    userId: number,
    page = 1,
    limit = 10,
    customerId?: number,
    invoiceId?: number,
    paymentMethod?: receipts_payment_method,
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

    if (data.invoice_id) {
      const invoice = await prisma.invoices.findFirst({
        where: { id: data.invoice_id, company_id: companyId },
      });
      if (!invoice) {
        throw new AppError('Invoice not found', 404);
      }
    }

    const receiptNumber = await this.generateReceiptNumber(companyId);

    const receipt = await prisma.receipts.create({
      data: {
        company_id: companyId,
        customer_id: data.customer_id,
        invoice_id: data.invoice_id || null,
        receipt_number: receiptNumber,
        receipt_date: data.receipt_date ? new Date(data.receipt_date) : new Date(),
        amount: data.amount,
        payment_method: data.payment_method || 'cash',
        description: data.description || null,
        received_by: data.received_by || null,
        notes: data.notes || null,
        created_by: userId,
      },
      include: { customers: true, invoices: true },
    });

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
    userId: number,
    templateId?: number
  ) {
    const receipt = await this.findById(id, companyId, userId);

    let template;

    if (templateId) {
      // Find specific template by ID
      template = await prisma.document_templates.findFirst({
        where: {
          id: templateId,
          document_type: 'receipt',
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
          document_type: 'receipt',
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

    // 2. Backend hanya mapping data (tanpa layout)
    const documentData = {
      company: {
        name: receipt.companies?.name,
        address: [
          receipt.companies?.address,
          receipt.companies?.city,
          receipt.companies?.province,
        ]
          .filter(Boolean)
          .join(', '),
        phone: receipt.companies?.phone,
        theme: {
          primary_color:
            receipt.companies?.company_settings?.primary_color ?? '#333333',
        },
      },

      document: {
        number: receipt.receipt_number,
        date: receipt.receipt_date,
      },

      customer: {
        name: receipt.customers?.name,
      },

      payment: {
        amount: Number(receipt.amount),
        method: receipt.payment_method,
        invoice_number: receipt.invoices?.invoice_number ?? undefined,
        description: receipt.description ?? undefined,
        received_by: receipt.received_by,
      },

      notes: receipt.notes ?? undefined,
    };

    // 3. Render HTML via schema-driven engine
    const templateSchema = template.template_schema as unknown as TemplateSchema;

    const htmlContent = documentGenerator.generateFromTemplate(
      templateSchema,
      documentData
    );

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

  async generateReceiptNumber(companyId: number) {
    const now = new Date();
    const year = now.getFullYear().toString();
    const month = (now.getMonth() + 1).toString().padStart(2, '0');

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const count = await prisma.receipts.count({
      where: {
        company_id: companyId,
        created_at: { gte: startOfMonth, lte: endOfMonth },
      },
    });

    const number = (count + 1).toString().padStart(4, '0');
    return `RCP-${year}${month}-${number}`;
  },
};
