import { prisma } from '../../../config/prisma';
import { AppError } from '../../../middleware/error.middleware';

export const companySettingsService = {
  async getSettings(companyId: number, userId: number) {
    // Verify ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    let settings = await prisma.company_settings.findUnique({
      where: { company_id: companyId },
    });

    // Create default settings if not exists
    if (!settings) {
      settings = await prisma.company_settings.create({
        data: {
          company_id: companyId,
          created_at: new Date(),
          updated_at: new Date(),
        },
      });
    }

    return settings;
  },

  async updateSettings(companyId: number, userId: number, data: {
    logo_url?: string;
    primary_color?: string;
    secondary_color?: string;
    font_family?: string;
    font_size?: number;
    header_text?: string;
    footer_text?: string;
    terms_conditions?: string;
    invoice_prefix?: string;
    invoice_number_format?: string;
    show_company_logo?: boolean;
    show_company_address?: boolean;
    show_tax_column?: boolean;
    show_discount_column?: boolean;
  }) {
    // Verify ownership
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found', 404);
    }

    // Get current prefix before update
    const currentSettings = await prisma.company_settings.findUnique({
      where: { company_id: companyId },
      select: { invoice_prefix: true },
    });
    const oldPrefix = currentSettings?.invoice_prefix ?? 'INV';
    const newPrefix = data.invoice_prefix;

    // Upsert settings
    const updated = await prisma.company_settings.upsert({
      where: { company_id: companyId },
      create: {
        company_id: companyId,
        ...data,
        created_at: new Date(),
        updated_at: new Date(),
      },
      update: {
        ...data,
        updated_at: new Date(),
      },
    });

    // Rename existing document numbers if prefix changed
    if (newPrefix && newPrefix !== oldPrefix) {
      await Promise.all([
        prisma.$executeRaw`
          UPDATE invoices
          SET invoice_number = REPLACE(invoice_number, ${`/${oldPrefix}/`}, ${`/${newPrefix}/`})
          WHERE company_id = ${companyId}
        `,
        prisma.$executeRaw`
          UPDATE receipts
          SET receipt_number = REPLACE(receipt_number, ${`/${oldPrefix}/`}, ${`/${newPrefix}/`})
          WHERE company_id = ${companyId}
        `,
        prisma.$executeRaw`
          UPDATE waybills
          SET waybill_number = REPLACE(waybill_number, ${`/${oldPrefix}/`}, ${`/${newPrefix}/`})
          WHERE company_id = ${companyId}
        `,
      ]);
    }

    return updated;
  },
};
