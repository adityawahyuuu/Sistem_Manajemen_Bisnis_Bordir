import Joi from 'joi';

export const updateSettingsSchema = Joi.object({
  logo_url: Joi.string().uri().max(500).optional().allow(null, ''),
  primary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  secondary_color: Joi.string().pattern(/^#[0-9A-Fa-f]{6}$/).optional(),
  font_family: Joi.string().max(100).optional(),
  font_size: Joi.number().integer().min(8).max(24).optional(),
  header_text: Joi.string().optional().allow(null, ''),
  footer_text: Joi.string().optional().allow(null, ''),
  terms_conditions: Joi.string().optional().allow(null, ''),
  invoice_prefix: Joi.string().max(10).optional(),
  invoice_number_format: Joi.string().max(100).optional(),
  show_company_logo: Joi.boolean().optional(),
  show_company_address: Joi.boolean().optional(),
  show_tax_column: Joi.boolean().optional(),
  show_discount_column: Joi.boolean().optional(),
});
