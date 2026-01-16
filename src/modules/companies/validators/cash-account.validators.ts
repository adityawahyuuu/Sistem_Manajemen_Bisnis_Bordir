import Joi from 'joi';

export const createCashAccountSchema = Joi.object({
  account_name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Account name must be at least 2 characters',
      'string.max': 'Account name must not exceed 255 characters',
      'any.required': 'Account name is required',
    }),
  account_number: Joi.string().max(100).optional().allow(null, ''),
  bank_name: Joi.string().max(255).optional().allow(null, ''),
  initial_balance: Joi.number().min(0).optional().default(0),
  description: Joi.string().optional().allow(null, ''),
});

export const updateCashAccountSchema = Joi.object({
  account_name: Joi.string().min(2).max(255).optional(),
  account_number: Joi.string().max(100).optional().allow(null, ''),
  bank_name: Joi.string().max(255).optional().allow(null, ''),
  description: Joi.string().optional().allow(null, ''),
  is_active: Joi.boolean().optional(),
});
