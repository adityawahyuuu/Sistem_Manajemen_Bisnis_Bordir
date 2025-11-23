import swaggerJsdoc from 'swagger-jsdoc';
import { appConfig } from './app.config';

const getServerUrl = (): string => {
  if (appConfig.env === 'production') {
    // Use RENDER_EXTERNAL_URL if available, otherwise use generic production URL
    return process.env.RENDER_EXTERNAL_URL || process.env.API_URL || 'https://your-app.onrender.com';
  }
  return `http://localhost:${appConfig.port}`;
};

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
        url: `${getServerUrl()}${appConfig.apiPrefix}`,
        description: appConfig.env === 'production' ? 'Production server' : 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter Firebase ID token',
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
            whatsapp_numbers: { type: 'array', items: { type: 'string' } },
            address: { type: 'string' },
            city: { type: 'string' },
            province: { type: 'string' },
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
  apis: ['./src/modules/**/*.routes.ts', './src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
