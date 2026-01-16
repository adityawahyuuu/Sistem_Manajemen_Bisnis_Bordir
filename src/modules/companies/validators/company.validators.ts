import Joi from 'joi';

export const createCompanySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Company name must be at least 2 characters',
      'string.max': 'Company name must not exceed 255 characters',
      'any.required': 'Company name is required',
    }),
  domain: Joi.string()
    .max(255)
    .optional()
    .allow(null, ''),
  address: Joi.string()
    .optional()
    .allow(null, ''),
  city: Joi.string()
    .max(100)
    .optional()
    .allow(null, ''),
  province: Joi.string()
    .max(100)
    .optional()
    .allow(null, ''),
  postal_code: Joi.string()
    .max(20)
    .optional()
    .allow(null, ''),
  phone: Joi.string()
    .max(50)
    .optional()
    .allow(null, ''),
  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Invalid email format',
    }),
});

export const updateCompanySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(255)
    .optional(),
  domain: Joi.string()
    .max(255)
    .optional()
    .allow(null, ''),
  address: Joi.string()
    .optional()
    .allow(null, ''),
  city: Joi.string()
    .max(100)
    .optional()
    .allow(null, ''),
  province: Joi.string()
    .max(100)
    .optional()
    .allow(null, ''),
  postal_code: Joi.string()
    .max(20)
    .optional()
    .allow(null, ''),
  phone: Joi.string()
    .max(50)
    .optional()
    .allow(null, ''),
  email: Joi.string()
    .email()
    .max(255)
    .optional()
    .allow(null, '')
    .messages({
      'string.email': 'Invalid email format',
    }),
  is_active: Joi.boolean().optional(),
});

export const companyIdSchema = Joi.object({
  id: Joi.number()
    .integer()
    .positive()
    .required()
    .messages({
      'number.base': 'Company ID must be a number',
      'number.positive': 'Company ID must be positive',
      'any.required': 'Company ID is required',
    }),
});
