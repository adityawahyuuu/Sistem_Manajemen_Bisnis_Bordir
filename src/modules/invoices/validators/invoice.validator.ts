import Joi from 'joi';

const invoiceItemSchema = Joi.object({
  id: Joi.number().integer().positive().optional(), // invoice_item.id (update only)

  item_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Item ID is required',
    'number.base': 'Item ID must be a number',
  }),

  name: Joi.string().required().messages({
    'any.required': 'Item name is required',
  }),

  description: Joi.string().allow('', null).optional(),

  quantity: Joi.number().min(0.01).required().messages({
    'any.required': 'Quantity is required',
    'number.min': 'Quantity must be greater than 0',
  }),

  unit_price: Joi.number().min(0).required().messages({
    'any.required': 'Unit price is required',
  }),

  unit: Joi.string().allow('', null).optional().default('pcs'),
});

export const createInvoiceSchema = Joi.object({
  company_id: Joi.number().integer().positive().required(),
  customer_id: Joi.number().integer().positive().required(),
  invoice_date: Joi.date().iso().optional(),
  due_date: Joi.date().iso().optional().allow(null),
  tax_amount: Joi.number().min(0).default(0),
  discount_amount: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null).optional(),

  items: Joi.array()
    .items(invoiceItemSchema)
    .min(1)
    .required()
    .messages({
      'array.min': 'At least one item is required',
      'any.required': 'Items are required',
    }),
});

export const updateInvoiceSchema = Joi.object({
  due_date: Joi.date().iso().optional().allow(null),
  tax_amount: Joi.number().min(0).optional(),
  discount_amount: Joi.number().min(0).optional(),
  notes: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('draft', 'sent', 'paid', 'cancelled').optional(),

  items: Joi.array()
    .items(invoiceItemSchema)
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one item is required when updating items',
    }),
});

export const invoiceIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const companyIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().allow(null),
  companyId: Joi.number().integer().positive().required(),
});

export const invoiceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  status: Joi.string().valid('draft', 'sent', 'paid', 'cancelled').optional(),
  customer_id: Joi.number().integer().positive().optional(),
  search: Joi.string().optional(),
});
