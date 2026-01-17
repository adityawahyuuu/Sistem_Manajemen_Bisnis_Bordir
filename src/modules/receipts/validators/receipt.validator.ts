import Joi from 'joi';

export const createReceiptSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Customer ID is required',
  }),
  invoice_id: Joi.number().integer().positive().optional().allow(null),
  receipt_date: Joi.date().iso().optional(),
  amount: Joi.number().min(0).required().messages({
    'any.required': 'Amount is required',
    'number.min': 'Amount must be greater than or equal to 0',
  }),
  payment_method: Joi.string().valid('cash', 'transfer', 'check', 'other').default('cash'),
  description: Joi.string().allow('', null).optional(),
  received_by: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
});

export const updateReceiptSchema = Joi.object({
  amount: Joi.number().min(0).optional(),
  payment_method: Joi.string().valid('cash', 'transfer', 'check', 'other').optional(),
  description: Joi.string().allow('', null).optional(),
  received_by: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
});

export const companyIdParamSchema = Joi.object({
  companyId: Joi.number().integer().positive().required(),
});

export const receiptQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  customer_id: Joi.number().integer().positive().optional(),
  invoice_id: Joi.number().integer().positive().optional(),
  payment_method: Joi.string().valid('cash', 'transfer', 'check', 'other').optional(),
  search: Joi.string().optional(),
});
