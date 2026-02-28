import swaggerJsdoc from 'swagger-jsdoc';
import { appConfig } from './app.config';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Sistem Manajemen Bisnis Bordir API',
      version: '1.0.0',
      description: 'API documentation for Embroidery Business Management System',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: appConfig.apiPrefix,
        description: 'API Server (auto-detect host)',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT access token received from /auth/login endpoint',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            error: { type: 'string' },
          },
        },
        Customer: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            company_name: { type: 'string' },
            email: { type: 'string' },
            phone: { type: 'string' },
            mobile_phone: { type: 'string' },
            address: { type: 'string' },
            province_code: { type: 'string' },
            city_code: { type: 'string' },
            subdistrict_code: { type: 'string' },
            village_code: { type: 'string' },
            postal_code: { type: 'string' },
            created_at: { type: 'string', format: 'date-time' },
            updated_at: { type: 'string', format: 'date-time' },
          },
        },
        Invoice: {
          type: 'object',
          required: ['customer_id', 'items'],
          properties: {
            customer_id: { type: 'string', example: 'xrJSfvp5bvVj7QUyxZrR' },
            invoice_date: { type: 'string', format: 'date-time' },
            due_date: { type: 'string', format: 'date' },
            tax_amount: { type: 'number', example: 0 },
            discount_amount: { type: 'number', example: 0 },
            notes: { type: 'string', example: 'Thank you for your order' },
            items: {
              type: 'array',
              items: {
                type: 'object',
                required: ['name', 'quantity', 'unit_price'],
                properties: {
                  name: { type: 'string', example: 'Bordir Logo Perusahaan' },
                  description: { type: 'string', example: 'Logo embroidery' },
                  quantity: { type: 'number', example: 100 },
                  unit_price: { type: 'number', example: 15000 },
                  unit: { type: 'string', example: 'pcs' },
                },
              },
            },
          },
        },
        Receipt: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            receipt_number: { type: 'string' },
            invoice_id: { type: 'string' },
            amount: { type: 'number' },
            payment_method: { type: 'string' },
            payment_date: { type: 'string', format: 'date-time' },
            created_at: { type: 'string', format: 'date-time' },
          },
        },
        Waybill: {
          type: 'object',
          required: ['invoice_id'],
          properties: {
            invoice_id: { type: 'string', example: 'HcCJOC8rWSQtVavKdcxy', description: 'Invoice ID - items and customer will be fetched from invoice' },
            waybill_date: { type: 'string', format: 'date-time' },
            destination_address: { type: 'string', example: 'Jl. Merdeka No. 123' },
            destination_city: { type: 'string', example: 'Jakarta' },
            destination_province: { type: 'string', example: 'DKI Jakarta' },
            vehicle_number: { type: 'string', example: 'B 1234 ABC' },
            driver_name: { type: 'string', example: 'John Driver' },
            driver_phone: { type: 'string', example: '081234567890' },
            notes: { type: 'string', example: 'Handle with care' },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  // Use TypeScript files in development, JavaScript files in production
  apis: process.env.NODE_ENV === 'production' || !__filename.endsWith('.ts')
    ? [
        path.join(__dirname, '../modules/auth/auth.routes.js'),
        path.join(__dirname, '../modules/companies/companies.routes.js'),
        path.join(__dirname, '../modules/customers/customer.routes.js'),
        path.join(__dirname, '../modules/items/items.routes.js'),
        path.join(__dirname, '../modules/invoices/invoice.routes.js'),
        path.join(__dirname, '../modules/receipts/receipt.routes.js'),
        path.join(__dirname, '../modules/waybills/waybill.routes.js'),
        path.join(__dirname, '../modules/master/master.routes.js'),
        path.join(__dirname, '../routes/*.js')
      ]
    : [
        path.join(__dirname, '../modules/auth/auth.routes.ts'),
        path.join(__dirname, '../modules/companies/companies.routes.ts'),
        path.join(__dirname, '../modules/customers/customer.routes.ts'),
        path.join(__dirname, '../modules/items/items.routes.ts'),
        path.join(__dirname, '../modules/invoices/invoice.routes.ts'),
        path.join(__dirname, '../modules/receipts/receipt.routes.ts'),
        path.join(__dirname, '../modules/waybills/waybill.routes.ts'),
        path.join(__dirname, '../modules/master/master.routes.ts'),
        path.join(__dirname, '../routes/*.ts')
      ],
};

// Export function to generate swagger spec asynchronously
export async function generateSwaggerSpec() {
  return await swaggerJsdoc(options);
}

// For backward compatibility, export synchronous version that returns Promise
export const swaggerSpec = generateSwaggerSpec();
