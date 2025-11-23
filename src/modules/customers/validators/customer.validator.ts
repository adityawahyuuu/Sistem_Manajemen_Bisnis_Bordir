import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  company_name: Joi.string().max(255).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(50).allow('', null),
  whatsapp_numbers: Joi.array().items(Joi.string()).default([]),
  address: Joi.string().allow('', null),
  city: Joi.string().max(100).allow('', null),
  province: Joi.string().max(100).allow('', null),
  postal_code: Joi.string().max(20).allow('', null),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  company_name: Joi.string().max(255).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(50).allow('', null),
  whatsapp_numbers: Joi.array().items(Joi.string()),
  address: Joi.string().allow('', null),
  city: Joi.string().max(100).allow('', null),
  province: Joi.string().max(100).allow('', null),
  postal_code: Joi.string().max(20).allow('', null),
});
