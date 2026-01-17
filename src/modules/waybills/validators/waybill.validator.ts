import Joi from 'joi';

export const createWaybillSchema = Joi.object({
  customer_id: Joi.number().integer().positive().required().messages({
    'any.required': 'Customer ID is required',
  }),
  invoice_id: Joi.number().integer().positive().optional().allow(null),
  waybill_date: Joi.date().iso().optional(),
  destination_address: Joi.string().allow('', null).optional(),
  destination_city: Joi.string().max(100).allow('', null).optional(),
  destination_province: Joi.string().max(100).allow('', null).optional(),
  vehicle_number: Joi.string().max(50).allow('', null).optional(),
  driver_name: Joi.string().max(255).allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  items: Joi.array()
    .items(
      Joi.object({
        name: Joi.string().required(),
        quantity: Joi.number().min(0.01).required(),
        unit: Joi.string().allow('', null).optional().default('pcs'),
        notes: Joi.string().allow('', null).optional(),
      })
    )
    .optional(),
});

export const updateWaybillSchema = Joi.object({
  destination_address: Joi.string().allow('', null).optional(),
  destination_city: Joi.string().max(100).allow('', null).optional(),
  destination_province: Joi.string().max(100).allow('', null).optional(),
  vehicle_number: Joi.string().max(50).allow('', null).optional(),
  driver_name: Joi.string().max(255).allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
  status: Joi.string().valid('pending', 'in_transit', 'delivered').optional(),
});

export const companyIdParamSchema = Joi.object({
  companyId: Joi.number().integer().positive().required(),
});

export const waybillQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  customer_id: Joi.number().integer().positive().optional(),
  invoice_id: Joi.number().integer().positive().optional(),
  status: Joi.string().valid('pending', 'in_transit', 'delivered').optional(),
  search: Joi.string().optional(),
});
