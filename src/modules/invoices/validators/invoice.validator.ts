import Joi from 'joi';

const invoiceItemSchema = Joi.object({
  id: Joi.number().integer().positive().optional(),

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

  unit: Joi.string().max(50).allow('', null).optional().default('pcs'),

  unit_price: Joi.number().min(0).required().messages({
    'any.required': 'Unit price is required',
  }),

  discount_type: Joi.string().valid('Rp', 'persen').default('Rp'),
  discount_amount: Joi.number().min(0).default(0),
});

export const createInvoiceSchema = Joi.object({
  company_id: Joi.number().integer().positive().required(),
  customer_id: Joi.number().integer().positive().required(),
  invoice_date: Joi.date().iso().optional(),
  due_date: Joi.date().iso().optional().allow(null),
  po_number: Joi.string().max(100).allow('', null).optional(),
  tax_amount: Joi.number().min(0).default(0),
  discount_amount: Joi.number().min(0).default(0),
  shipping_cost: Joi.number().min(0).default(0),
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
  po_number: Joi.string().max(100).allow('', null).optional(),
  tax_amount: Joi.number().min(0).optional(),
  discount_amount: Joi.number().min(0).optional(),
  shipping_cost: Joi.number().min(0).optional(),
  notes: Joi.string().allow('', null).optional(),
  items: Joi.array()
    .items(invoiceItemSchema)
    .min(1)
    .optional()
    .messages({
      'array.min': 'At least one item is required when updating items',
    }),
});

const PAYMENT_METHODS = ['cash', 'transfer', 'check', 'other'];

export const createPaymentSchema = Joi.object({
  payment_date: Joi.date().iso().required().messages({
    'any.required': 'Payment date is required',
  }),
  amount: Joi.number().positive().required().messages({
    'any.required': 'Amount is required',
    'number.positive': 'Amount must be greater than 0',
  }),
  payment_method: Joi.string().valid(...PAYMENT_METHODS).required().messages({
    'any.required': 'Payment method is required',
    'any.only': `Payment method must be one of: ${PAYMENT_METHODS.join(', ')}`,
  }),
  notes: Joi.string().allow('', null).optional(),
});

export const updatePaymentSchema = Joi.object({
  payment_date: Joi.date().iso().optional(),
  amount: Joi.number().positive().optional(),
  payment_method: Joi.string().valid(...PAYMENT_METHODS).optional(),
  notes: Joi.string().allow('', null).optional(),
});

export const invoiceIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
});

export const companyIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().allow(null),
  companyId: Joi.number().integer().positive().required(),
  paymentId: Joi.number().integer().positive().allow(null),
});

export const invoiceQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  customer_id: Joi.number().integer().positive().optional(),
  search: Joi.string().optional(),
  date_from: Joi.date().iso().optional(),
  date_to: Joi.date().iso().optional(),
  payment_status: Joi.string().valid('lunas', 'dp', 'belum_bayar').optional(),
});
