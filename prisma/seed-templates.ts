import { PrismaClient, document_template_type } from './generated/prisma';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as dotenv from 'dotenv';
import {
  getDefaultInvoiceTemplate,
  getDefaultReceiptTemplate,
  getDefaultWaybillTemplate,
} from '../src/shared/utils/html-builder.util';

// Load environment variables
dotenv.config();

const adapter = new PrismaMariaDb({
  host: process.env.DATABASE_HOST || 'localhost',
  port: parseInt(process.env.DATABASE_PORT || '3306'),
  user: process.env.DATABASE_USER,
  password: process.env.DATABASE_PASSWORD,
  database: process.env.DATABASE_NAME,
  connectionLimit: 10
});

const prisma = new PrismaClient({ adapter });

interface TemplateData {
  name: string;
  description: string;
  document_type: document_template_type;
  template_schema: object;
}

async function createOrUpdateSystemTemplate(data: TemplateData) {
  // Check if template already exists
  const existing = await prisma.document_templates.findFirst({
    where: {
      is_system: true,
      name: data.name,
      document_type: data.document_type,
    },
  });

  if (existing) {
    console.log(`  - ${data.name} (${data.document_type}) already exists, skipping`);
    return existing;
  }

  const template = await prisma.document_templates.create({
    data: {
      company_id: null,
      name: data.name,
      description: data.description,
      document_type: data.document_type,
      template_schema: data.template_schema,
      version: 1,
      status: 'published',
      is_default: false,
      is_system: true,
      published_at: new Date(),
    },
  });

  console.log(`  + Created: ${data.name} (${data.document_type})`);
  return template;
}

async function seedSystemTemplates() {
  console.log('Seeding system preset templates...\n');

  // Invoice Templates
  console.log('Invoice Templates:');

  // Modern Minimalist Invoice
  await createOrUpdateSystemTemplate({
    name: 'Modern Minimalist',
    description: 'Template invoice modern dengan desain minimalis',
    document_type: 'invoice',
    template_schema: getDefaultInvoiceTemplate(),
  });

  // Classic Professional Invoice
  const classicInvoiceSchema = getDefaultInvoiceTemplate();
  classicInvoiceSchema.styles.primaryColor = '#1e3a5f';
  classicInvoiceSchema.styles.fontFamily = 'Times New Roman, serif';
  classicInvoiceSchema.header.layout = 'centered';
  classicInvoiceSchema.table.headerStyle.backgroundColor = '#1e3a5f';

  await createOrUpdateSystemTemplate({
    name: 'Classic Professional',
    description: 'Template invoice klasik dengan tampilan profesional',
    document_type: 'invoice',
    template_schema: classicInvoiceSchema,
  });

  // Bold Corporate Invoice
  const boldInvoiceSchema = getDefaultInvoiceTemplate();
  boldInvoiceSchema.styles.primaryColor = '#2563eb';
  boldInvoiceSchema.styles.secondaryColor = '#3b82f6';
  boldInvoiceSchema.table.headerStyle.backgroundColor = '#2563eb';
  boldInvoiceSchema.table.rowStyle.alternateColors = true;
  boldInvoiceSchema.table.rowStyle.alternateColor = '#f0f7ff';

  await createOrUpdateSystemTemplate({
    name: 'Bold Corporate',
    description: 'Template invoice dengan warna korporat yang kuat',
    document_type: 'invoice',
    template_schema: boldInvoiceSchema,
  });

  // Receipt Templates
  console.log('\nReceipt Templates:');

  await createOrUpdateSystemTemplate({
    name: 'Standard Receipt',
    description: 'Template kwitansi standar',
    document_type: 'receipt',
    template_schema: getDefaultReceiptTemplate(),
  });

  // Waybill Templates
  console.log('\nWaybill Templates:');

  await createOrUpdateSystemTemplate({
    name: 'Standard Waybill',
    description: 'Template surat jalan standar',
    document_type: 'waybill',
    template_schema: getDefaultWaybillTemplate(),
  });

  console.log('\n✓ System preset templates seeded successfully!');
}

async function main() {
  try {
    await seedSystemTemplates();
  } catch (error) {
    console.error('Error seeding templates:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main();
