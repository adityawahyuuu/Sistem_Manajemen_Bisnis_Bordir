import { prisma } from '../../../database/prisma.client';
import { AppError } from '../../../middleware';
import {
  document_template_type,
  document_template_status,
} from '../../../../prisma/generated/prisma';
import {
  TemplateSchema,
  CreateTemplateDto,
  UpdateTemplateDto,
  PublishValidationResult,
} from '../interfaces/template.interface';

// Deep merge utility for autosave
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function deepMerge(target: any, source: any): any {
  const result = { ...target };
  for (const key in source) {
    if (source[key] !== undefined) {
      if (
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key]) &&
        typeof target[key] === 'object' &&
        target[key] !== null
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

export const templateService = {
  /**
   * Verify company ownership
   */
  async verifyCompanyAccess(companyId: number, userId: number) {
    const company = await prisma.companies.findFirst({
      where: { id: companyId, user_id: userId, deleted_at: null },
    });

    if (!company) {
      throw new AppError('Company not found or access denied', 404);
    }

    return company;
  },

  /**
   * Get all system preset templates
   */
  async findAllPresets(documentType?: document_template_type) {
    const where: Record<string, unknown> = {
      is_system: true,
      deleted_at: null,
      ...(documentType && { document_type: documentType }),
    };

    return prisma.document_templates.findMany({
      where,
      orderBy: { name: 'asc' },
    });
  },

  /**
   * Get all templates for a company (includes both user and system templates)
   */
  async findAllByCompany(
    companyId: number,
    userId: number,
    page = 1,
    limit = 10,
    documentType?: document_template_type,
    status?: document_template_status,
    search?: string
  ) {
    await this.verifyCompanyAccess(companyId, userId);

    const where: Record<string, unknown> = {
      company_id: companyId,
      deleted_at: null,
      ...(documentType && { document_type: documentType }),
      ...(status && { status }),
      ...(search && {
        OR: [
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
    };

    const [templates, total] = await Promise.all([
      prisma.document_templates.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: [{ is_default: 'desc' }, { updated_at: 'desc' }],
        include: {
          created_by_user: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.document_templates.count({ where }),
    ]);

    return { data: templates, total };
  },

  /**
   * Get template by ID
   */
  async findById(id: number, companyId: number, userId: number) {
    await this.verifyCompanyAccess(companyId, userId);

    const template = await prisma.document_templates.findFirst({
      where: {
        id,
        OR: [
          { company_id: companyId },
          { is_system: true },
        ],
        deleted_at: null,
      },
      include: {
        created_by_user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!template) {
      throw new AppError('Template not found', 404);
    }

    return template;
  },

  /**
   * Get system preset template by ID
   */
  async findPresetById(id: number) {
    const template = await prisma.document_templates.findFirst({
      where: {
        id,
        is_system: true,
        deleted_at: null,
      },
    });

    if (!template) {
      throw new AppError('System preset template not found', 404);
    }

    return template;
  },

  /**
   * Create a new template
   */
  async create(companyId: number, userId: number, data: CreateTemplateDto) {
    await this.verifyCompanyAccess(companyId, userId);

    // Check for duplicate name
    const existing = await prisma.document_templates.findFirst({
      where: {
        company_id: companyId,
        name: data.name,
        document_type: data.document_type,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new AppError(
        `Template with name "${data.name}" already exists for this document type`,
        409
      );
    }

    // If setting as default, unset other defaults
    if (data.is_default) {
      await prisma.document_templates.updateMany({
        where: {
          company_id: companyId,
          document_type: data.document_type,
          is_default: true,
          deleted_at: null,
        },
        data: { is_default: false },
      });
    }

    return prisma.document_templates.create({
      data: {
        company_id: companyId,
        name: data.name,
        description: data.description || null,
        document_type: data.document_type,
        template_schema: data.template_schema as object,
        version: 1,
        status: document_template_status.draft,
        is_default: data.is_default || false,
        is_system: false,
        created_by: userId,
      },
    });
  },

  /**
   * Update a template (full update)
   */
  async update(
    id: number,
    companyId: number,
    userId: number,
    data: UpdateTemplateDto
  ) {
    const template = await this.findById(id, companyId, userId);

    if (template.is_system) {
      throw new AppError('Cannot modify system preset template', 403);
    }

    // Check for duplicate name if name is being changed
    if (data.name && data.name !== template.name) {
      const existing = await prisma.document_templates.findFirst({
        where: {
          company_id: companyId,
          name: data.name,
          document_type: template.document_type,
          id: { not: id },
          deleted_at: null,
        },
      });

      if (existing) {
        throw new AppError(
          `Template with name "${data.name}" already exists for this document type`,
          409
        );
      }
    }

    // If setting as default, unset other defaults
    if (data.is_default && !template.is_default) {
      await prisma.document_templates.updateMany({
        where: {
          company_id: companyId,
          document_type: template.document_type,
          is_default: true,
          id: { not: id },
          deleted_at: null,
        },
        data: { is_default: false },
      });
    }

    return prisma.document_templates.update({
      where: { id },
      data: {
        ...(data.name && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.template_schema && { template_schema: data.template_schema as object }),
        ...(data.is_default !== undefined && { is_default: data.is_default }),
        status: document_template_status.draft, // Any update sets status back to draft
        updated_at: new Date(),
      },
    });
  },

  /**
   * Autosave template (partial update, no validation)
   */
  async autosave(
    id: number,
    companyId: number,
    userId: number,
    partialSchema: Partial<TemplateSchema>
  ) {
    const template = await this.findById(id, companyId, userId);

    if (template.is_system) {
      throw new AppError('Cannot modify system preset template', 403);
    }

    const currentSchema = template.template_schema as unknown as TemplateSchema;
    const mergedSchema = deepMerge(currentSchema, partialSchema) as TemplateSchema;

    await prisma.document_templates.update({
      where: { id },
      data: {
        template_schema: mergedSchema as object,
        status: document_template_status.draft,
        updated_at: new Date(),
      },
    });

    return mergedSchema;
  },

  /**
   * Validate template for publishing
   */
  validateForPublish(
    schema: TemplateSchema,
    documentType: document_template_type
  ): PublishValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Common validation
    if (!schema.schemaVersion) {
      errors.push('Schema version is required');
    }

    // Document type specific validation
    if (documentType === 'invoice') {
      // Invoice must have recipient
      if (!schema.recipient?.enabled) {
        errors.push('Invoice template must have recipient section enabled');
      } else if (!schema.recipient.showName) {
        errors.push('Invoice template recipient must show customer name');
      }

      // Invoice must have table
      if (!schema.table?.enabled) {
        errors.push('Invoice template must have items table enabled');
      } else {
        const requiredColumns = ['description', 'quantity', 'unit_price', 'total'];
        const visibleColumns = schema.table.columns
          .filter((c) => c.visible)
          .map((c) => c.field);

        for (const col of requiredColumns) {
          if (!visibleColumns.includes(col)) {
            errors.push(`Invoice template table must have visible "${col}" column`);
          }
        }
      }

      // Invoice must have summary with total
      if (!schema.summary?.enabled) {
        errors.push('Invoice template must have summary section enabled');
      } else {
        const hasTotalField = schema.summary.fields.some(
          (f) => f.field === 'total' && f.visible
        );
        if (!hasTotalField) {
          errors.push('Invoice template summary must have visible "total" field');
        }
      }
    }

    if (documentType === 'receipt') {
      // Receipt must show receipt number
      if (!schema.header?.documentInfo?.showNumber) {
        errors.push('Receipt template must show receipt number');
      }

      // Receipt must have recipient
      if (!schema.recipient?.enabled) {
        errors.push('Receipt template must have recipient section enabled');
      }
    }

    if (documentType === 'waybill') {
      // Waybill must have recipient
      if (!schema.recipient?.enabled) {
        errors.push('Waybill template must have recipient section enabled');
      }

      // Waybill must have table
      if (!schema.table?.enabled) {
        errors.push('Waybill template must have items table enabled');
      } else {
        const requiredColumns = ['description', 'quantity'];
        const visibleColumns = schema.table.columns
          .filter((c) => c.visible)
          .map((c) => c.field);

        for (const col of requiredColumns) {
          if (!visibleColumns.includes(col)) {
            errors.push(`Waybill template table must have visible "${col}" column`);
          }
        }
      }
    }

    // Warnings (non-blocking)
    if (schema.table?.enabled) {
      const columnIds = schema.table.columns.map((c) => c.id);
      const uniqueIds = new Set(columnIds);
      if (columnIds.length !== uniqueIds.size) {
        warnings.push('Table has duplicate column IDs');
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  },

  /**
   * Validate template without publishing
   */
  async validate(id: number, companyId: number, userId: number) {
    const template = await this.findById(id, companyId, userId);
    const schema = template.template_schema as unknown as TemplateSchema;

    return this.validateForPublish(schema, template.document_type);
  },

  /**
   * Publish template
   */
  async publish(id: number, companyId: number, userId: number) {
    const template = await this.findById(id, companyId, userId);

    if (template.is_system) {
      throw new AppError('Cannot publish system preset template', 403);
    }

    const schema = template.template_schema as unknown as TemplateSchema;
    const validation = this.validateForPublish(schema, template.document_type);

    if (!validation.valid) {
      throw new AppError(
        `Cannot publish template: ${validation.errors.join('; ')}`,
        400
      );
    }

    // Archive current version
    await prisma.document_template_versions.create({
      data: {
        template_id: id,
        version: template.version,
        template_schema: template.template_schema as object,
        published_by: userId,
      },
    });

    // Update template
    return prisma.document_templates.update({
      where: { id },
      data: {
        version: template.version + 1,
        status: document_template_status.published,
        published_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  /**
   * Get version history
   */
  async getVersions(id: number, companyId: number, userId: number) {
    await this.findById(id, companyId, userId);

    return prisma.document_template_versions.findMany({
      where: { template_id: id },
      orderBy: { version: 'desc' },
      include: {
        published_by_user: {
          select: { id: true, name: true },
        },
      },
    });
  },

  /**
   * Get specific version
   */
  async getVersion(
    id: number,
    version: number,
    companyId: number,
    userId: number
  ) {
    await this.findById(id, companyId, userId);

    const versionRecord = await prisma.document_template_versions.findFirst({
      where: { template_id: id, version },
      include: {
        published_by_user: {
          select: { id: true, name: true },
        },
      },
    });

    if (!versionRecord) {
      throw new AppError(`Version ${version} not found`, 404);
    }

    return versionRecord;
  },

  /**
   * Revert to a specific version
   */
  async revertToVersion(
    id: number,
    version: number,
    companyId: number,
    userId: number
  ) {
    const template = await this.findById(id, companyId, userId);

    if (template.is_system) {
      throw new AppError('Cannot modify system preset template', 403);
    }

    const versionRecord = await this.getVersion(id, version, companyId, userId);

    return prisma.document_templates.update({
      where: { id },
      data: {
        template_schema: versionRecord.template_schema as object,
        status: document_template_status.draft,
        updated_at: new Date(),
      },
    });
  },

  /**
   * Clone a template
   */
  async clone(
    id: number,
    companyId: number,
    userId: number,
    newName: string,
    description?: string
  ) {
    // Source can be company template or system preset
    let sourceTemplate;

    // First try to find as company template
    try {
      sourceTemplate = await this.findById(id, companyId, userId);
    } catch {
      // If not found as company template, try as system preset
      sourceTemplate = await this.findPresetById(id);
    }

    // Check for duplicate name
    const existing = await prisma.document_templates.findFirst({
      where: {
        company_id: companyId,
        name: newName,
        document_type: sourceTemplate.document_type,
        deleted_at: null,
      },
    });

    if (existing) {
      throw new AppError(
        `Template with name "${newName}" already exists for this document type`,
        409
      );
    }

    return prisma.document_templates.create({
      data: {
        company_id: companyId,
        name: newName,
        description: description || sourceTemplate.description,
        document_type: sourceTemplate.document_type,
        template_schema: sourceTemplate.template_schema as object,
        version: 1,
        status: document_template_status.draft,
        is_default: false,
        is_system: false,
        created_by: userId,
      },
    });
  },

  /**
   * Set template as default
   */
  async setAsDefault(id: number, companyId: number, userId: number) {
    const template = await this.findById(id, companyId, userId);

    if (template.is_system) {
      throw new AppError('Cannot set system preset as default', 403);
    }

    // Unset other defaults for this document type
    await prisma.document_templates.updateMany({
      where: {
        company_id: companyId,
        document_type: template.document_type,
        is_default: true,
        id: { not: id },
        deleted_at: null,
      },
      data: { is_default: false },
    });

    return prisma.document_templates.update({
      where: { id },
      data: {
        is_default: true,
        updated_at: new Date(),
      },
    });
  },

  /**
   * Soft delete a template
   */
  async delete(id: number, companyId: number, userId: number) {
    const template = await this.findById(id, companyId, userId);

    if (template.is_system) {
      throw new AppError('Cannot delete system preset template', 403);
    }

    if (template.is_default) {
      throw new AppError(
        'Cannot delete default template. Set another template as default first.',
        400
      );
    }

    return prisma.document_templates.update({
      where: { id },
      data: {
        deleted_at: new Date(),
        updated_at: new Date(),
      },
    });
  },

  /**
   * Get default template for a document type
   */
  async getDefaultTemplate(companyId: number, documentType: document_template_type) {
    return prisma.document_templates.findFirst({
      where: {
        company_id: companyId,
        document_type: documentType,
        is_default: true,
        deleted_at: null,
      },
    });
  },
};
