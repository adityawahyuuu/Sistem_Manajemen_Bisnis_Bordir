import Joi from 'joi';

// ============ Schema Component Validators ============

const hexColorPattern = /^#[0-9A-Fa-f]{6}$/;

const pageSettingsSchema = Joi.object({
  size: Joi.string().valid('A4', 'Letter', 'Legal').required(),
  orientation: Joi.string().valid('portrait', 'landscape').required(),
  margins: Joi.object({
    top: Joi.number().min(0).max(100).required(),
    right: Joi.number().min(0).max(100).required(),
    bottom: Joi.number().min(0).max(100).required(),
    left: Joi.number().min(0).max(100).required(),
  }).required(),
}).required();

const styleSettingsSchema = Joi.object({
  primaryColor: Joi.string().pattern(hexColorPattern).required().messages({
    'string.pattern.base': 'Primary color must be a valid hex color (e.g., #000000)',
  }),
  secondaryColor: Joi.string().pattern(hexColorPattern).required().messages({
    'string.pattern.base': 'Secondary color must be a valid hex color (e.g., #666666)',
  }),
  fontFamily: Joi.string().max(100).required(),
  fontSize: Joi.number().min(8).max(24).required(),
  lineHeight: Joi.number().min(1).max(3).required(),
}).required();

const logoSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  position: Joi.string().valid('left', 'right', 'center').required(),
  maxHeight: Joi.number().min(10).max(500).required(),
  maxWidth: Joi.number().min(10).max(500).required(),
}).required();

const companyInfoSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  showName: Joi.boolean().required(),
  showAddress: Joi.boolean().required(),
  showPhone: Joi.boolean().required(),
  showEmail: Joi.boolean().required(),
}).required();

const documentInfoSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  showTitle: Joi.boolean().required(),
  titleText: Joi.string().max(100).allow('', null).optional(),
  showNumber: Joi.boolean().required(),
  showDate: Joi.boolean().required(),
  showDueDate: Joi.boolean().required(),
  showStatus: Joi.boolean().required(),
}).required();

const headerSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  layout: Joi.string().valid('left-right', 'centered', 'stacked').required(),
  logo: logoSettingsSchema,
  companyInfo: companyInfoSettingsSchema,
  documentInfo: documentInfoSettingsSchema,
  customText: Joi.string().max(500).allow('', null).optional(),
}).required();

const recipientSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  title: Joi.string().max(100).required(),
  showName: Joi.boolean().required(),
  showCompanyName: Joi.boolean().required(),
  showAddress: Joi.boolean().required(),
  showPhone: Joi.boolean().required(),
  showEmail: Joi.boolean().required(),
}).required();

const tableColumnSchema = Joi.object({
  id: Joi.string().max(50).required(),
  field: Joi.string().max(50).required(),
  header: Joi.string().max(100).required(),
  width: Joi.string().max(20).allow('', null).optional(),
  align: Joi.string().valid('left', 'center', 'right').required(),
  format: Joi.string().valid('text', 'number', 'currency', 'date').optional(),
  visible: Joi.boolean().required(),
});

const tableSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  columns: Joi.array().items(tableColumnSchema).min(1).required(),
  showHeader: Joi.boolean().required(),
  headerStyle: Joi.object({
    backgroundColor: Joi.string().pattern(hexColorPattern).required(),
    textColor: Joi.string().pattern(hexColorPattern).required(),
    fontWeight: Joi.string().valid('normal', 'bold').required(),
  }).required(),
  rowStyle: Joi.object({
    alternateColors: Joi.boolean().required(),
    alternateColor: Joi.string().pattern(hexColorPattern).allow('', null).optional(),
    borderBottom: Joi.boolean().required(),
  }).required(),
}).required();

const summaryFieldConditionSchema = Joi.object({
  field: Joi.string().max(50).required(),
  operator: Joi.string().valid('exists', 'gt', 'lt', 'eq', 'ne').required(),
  value: Joi.any().optional(),
});

const summaryFieldSchema = Joi.object({
  id: Joi.string().max(50).required(),
  field: Joi.string().max(50).required(),
  label: Joi.string().max(100).required(),
  format: Joi.string().valid('currency', 'percentage', 'text').required(),
  visible: Joi.boolean().required(),
  isGrandTotal: Joi.boolean().optional(),
  condition: summaryFieldConditionSchema.optional(),
});

const summarySettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  position: Joi.string().valid('right', 'left', 'full-width').required(),
  fields: Joi.array().items(summaryFieldSchema).min(1).required(),
}).required();

const notesSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  title: Joi.string().max(100).required(),
  showIfEmpty: Joi.boolean().required(),
}).required();

const termsSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  title: Joi.string().max(100).required(),
  showIfEmpty: Joi.boolean().required(),
}).required();

const signatureColumnSchema = Joi.object({
  id: Joi.string().max(50).required(),
  title: Joi.string().max(100).required(),
  enabled: Joi.boolean().required(),
});

const signatureSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  columns: Joi.array().items(signatureColumnSchema).min(1).max(4).required(),
}).required();

const footerSettingsSchema = Joi.object({
  enabled: Joi.boolean().required(),
  text: Joi.string().max(500).allow('', null).optional(),
  showPageNumber: Joi.boolean().required(),
}).required();

// ============ Full Template Schema Validator ============

export const templateSchemaValidator = Joi.object({
  schemaVersion: Joi.string().max(20).required(),
  page: pageSettingsSchema,
  styles: styleSettingsSchema,
  header: headerSettingsSchema,
  recipient: recipientSettingsSchema,
  table: tableSettingsSchema,
  summary: summarySettingsSchema,
  notes: notesSettingsSchema,
  terms: termsSettingsSchema,
  signature: signatureSettingsSchema,
  footer: footerSettingsSchema,
}).required();

// Partial schema for autosave (allows partial updates)
export const partialTemplateSchemaValidator = Joi.object({
  schemaVersion: Joi.string().max(20).optional(),
  page: Joi.object({
    size: Joi.string().valid('A4', 'Letter', 'Legal').optional(),
    orientation: Joi.string().valid('portrait', 'landscape').optional(),
    margins: Joi.object({
      top: Joi.number().min(0).max(100).optional(),
      right: Joi.number().min(0).max(100).optional(),
      bottom: Joi.number().min(0).max(100).optional(),
      left: Joi.number().min(0).max(100).optional(),
    }).optional(),
  }).optional(),
  styles: Joi.object({
    primaryColor: Joi.string().pattern(hexColorPattern).optional(),
    secondaryColor: Joi.string().pattern(hexColorPattern).optional(),
    fontFamily: Joi.string().max(100).optional(),
    fontSize: Joi.number().min(8).max(24).optional(),
    lineHeight: Joi.number().min(1).max(3).optional(),
  }).optional(),
  header: Joi.object().optional(),
  recipient: Joi.object().optional(),
  table: Joi.object().optional(),
  summary: Joi.object().optional(),
  notes: Joi.object().optional(),
  terms: Joi.object().optional(),
  signature: Joi.object().optional(),
  footer: Joi.object().optional(),
}).min(1);

// ============ API Request Validators ============

export const createTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'any.required': 'Template name is required',
    'string.min': 'Template name cannot be empty',
    'string.max': 'Template name cannot exceed 255 characters',
  }),
  description: Joi.string().max(1000).allow('', null).optional(),
  document_type: Joi.string().valid('invoice', 'receipt', 'waybill').required().messages({
    'any.required': 'Document type is required',
    'any.only': 'Document type must be invoice, receipt, or waybill',
  }),
  template_schema: templateSchemaValidator.required().messages({
    'any.required': 'Template schema is required',
  }),
});

export const updateTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(255).optional().messages({
    'string.min': 'Template name cannot be empty',
    'string.max': 'Template name cannot exceed 255 characters',
  }),
  description: Joi.string().max(1000).allow('', null).optional(),
  template_schema: templateSchemaValidator.optional(),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});

export const autosaveTemplateSchema = Joi.object({
  template_schema: partialTemplateSchemaValidator.required().messages({
    'any.required': 'Template schema is required for autosave',
  }),
});

export const cloneTemplateSchema = Joi.object({
  name: Joi.string().min(1).max(255).required().messages({
    'any.required': 'New template name is required',
    'string.min': 'Template name cannot be empty',
    'string.max': 'Template name cannot exceed 255 characters',
  }),
  description: Joi.string().max(1000).allow('', null).optional(),
});

// ============ Parameter Validators ============

export const templateIdParamSchema = Joi.object({
  id: Joi.number().integer().positive().required().messages({
    'any.required': 'Template ID is required',
    'number.base': 'Template ID must be a number',
  }),
});

export const companyIdParamSchema = Joi.object({
  companyId: Joi.number().integer().positive().required().messages({
    'any.required': 'Company ID is required',
    'number.base': 'Company ID must be a number',
  }),
});

export const templateWithCompanyParamsSchema = Joi.object({
    companyId: Joi.number().integer().positive().required().messages({
      'any.required': 'Company ID is required',
      'number.base': 'Company ID must be a number',
    }),
    id: Joi.number().integer().positive().required().messages({
      'any.required': 'Template ID is required',
      'number.base': 'Template ID must be a number',
    }),
  });

export const versionParamSchema = Joi.object({
  version: Joi.number().integer().positive().required().messages({
    'any.required': 'Version number is required',
    'number.base': 'Version must be a number',
  }),
});

// ============ Query Validators ============

export const templateQuerySchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  document_type: Joi.string().valid('invoice', 'receipt', 'waybill').optional(),
  status: Joi.string().valid('draft', 'published').optional(),
  search: Joi.string().max(255).optional(),
});
