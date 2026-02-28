import Joi from 'joi';

export const createItemSchema = Joi.object({
  item_name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Item name must be at least 2 characters',
      'string.max': 'Item name must not exceed 255 characters',
      'any.required': 'Item name is required',
    }),
  description: Joi.string().optional().allow(null, ''),
  unit: Joi.string().max(50).optional(),
  unit_price: Joi.number().min(0).optional().default(0),
  category: Joi.string().optional().allow(null, ''),
});

export const updateItemSchema = Joi.object({
  item_name: Joi.string().min(2).max(255).optional(),
  description: Joi.string().optional().allow(null, ''),
  unit: Joi.string().max(50).optional(),
  unit_price: Joi.number().min(0).optional(),
  category: Joi.string().optional().allow(null, ''),
});

export const addCustomerItemSchema = Joi.object({
  id: Joi.number().integer().positive().required(),
  custom_price: Joi.number().min(0).optional().allow(null),
  notes: Joi.string().optional().allow(null, ''),
});
