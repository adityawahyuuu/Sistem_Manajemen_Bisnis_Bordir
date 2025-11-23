import Joi from 'joi';

export const createInvoiceSchema = Joi.object({
  customer_id: Joi.string().required(),
  invoice_date: Joi.date().iso(),
  due_date: Joi.date().iso(),
  tax_amount: Joi.number().min(0).default(0),
  discount_amount: Joi.number().min(0).default(0),
  notes: Joi.string().allow('', null),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow('', null),
      quantity: Joi.number().min(0.01).required(),
      unit_price: Joi.number().min(0).required(),
      unit: Joi.string().allow('', null),
    })
  ).min(1).required(),
});

export const updateInvoiceSchema = Joi.object({
  due_date: Joi.date().iso(),
  tax_amount: Joi.number().min(0),
  discount_amount: Joi.number().min(0),
  notes: Joi.string().allow('', null),
  status: Joi.string().valid('draft', 'generated', 'sent', 'paid', 'cancelled'),
});
