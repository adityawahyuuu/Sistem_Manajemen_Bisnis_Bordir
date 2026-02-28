import Joi from 'joi';

export const createCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
  company_name: Joi.string().max(255).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(50).allow('', null),
  mobile_phone: Joi.string().max(50).allow('', null),
  address: Joi.string().allow('', null),
  province_code: Joi.string().max(10).allow('', null),
  city_code: Joi.string().max(10).allow('', null),
  subdistrict_code: Joi.string().max(10).allow('', null),
  village_code: Joi.string().max(10).allow('', null),
  postal_code: Joi.string().max(10).allow('', null),
});

export const updateCustomerSchema = Joi.object({
  name: Joi.string().min(2).max(255),
  company_name: Joi.string().max(255).allow('', null),
  email: Joi.string().email().allow('', null),
  phone: Joi.string().max(50).allow('', null),
  mobile_phone: Joi.string().max(50).allow('', null),
  address: Joi.string().allow('', null),
  province_code: Joi.string().max(10).allow('', null),
  city_code: Joi.string().max(10).allow('', null),
  subdistrict_code: Joi.string().max(10).allow('', null),
  village_code: Joi.string().max(10).allow('', null),
  postal_code: Joi.string().max(10).allow('', null),
});
