import Joi from 'joi';

export const createWaybillSchema = Joi.object({
  invoice_id: Joi.string().required(),
  waybill_date: Joi.date().iso(),
  destination_address: Joi.string().allow('', null),
  destination_city: Joi.string().max(100).allow('', null),
  destination_province: Joi.string().max(100).allow('', null),
  vehicle_number: Joi.string().max(50).allow('', null),
  driver_name: Joi.string().max(255).allow('', null),
  driver_phone: Joi.string().max(20).allow('', null),
  notes: Joi.string().allow('', null),
});

export const updateWaybillSchema = Joi.object({
  destination_address: Joi.string().allow('', null),
  destination_city: Joi.string().max(100).allow('', null),
  destination_province: Joi.string().max(100).allow('', null),
  vehicle_number: Joi.string().max(50).allow('', null),
  driver_name: Joi.string().max(255).allow('', null),
  notes: Joi.string().allow('', null),
  status: Joi.string().valid('draft', 'generated', 'sent', 'delivered', 'cancelled'),
});
