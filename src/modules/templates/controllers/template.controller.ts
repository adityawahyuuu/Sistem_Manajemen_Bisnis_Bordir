import { Request, Response, NextFunction } from 'express';
import { templateService } from '../services/template.service';
import {
  sendSuccess,
  sendCreated,
  sendSuccessWithDates,
  sendCreatedWithDates,
} from '../../../shared/utils/response.util';
import {
  document_template_type,
  document_template_status,
} from '../../../../prisma/generated/prisma';

export const templateController = {
  /**
   * Get all system preset templates
   * GET /templates/presets
   */
  async findAllPresets(req: Request, res: Response, next: NextFunction) {
    try {
      const templates = await templateService.findAllPresets();

      sendSuccessWithDates(res, templates, 'System preset templates retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get default preset templates (one per document type)
   * GET /templates/presets/defaults
   */
  async findDefaultPresets(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      
      const templates = await templateService.findDefaultPresets(companyId, userId);

      sendSuccessWithDates(res, templates, 'Default preset templates retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get all templates for a company
   * GET /templates/company/:companyId
   */
  async findAllByCompany(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const documentType = req.query.document_type as document_template_type | undefined;
      const status = req.query.status as document_template_status | undefined;
      const search = req.query.search as string | undefined;

      const { data, total } = await templateService.findAllByCompany(
        companyId,
        userId,
        page,
        limit,
        documentType,
        status,
        search
      );

      sendSuccessWithDates(res, data, 'Templates retrieved', 200, {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get template by ID
   * GET /templates/company/:companyId/:id
   */
  async findById(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const template = await templateService.findById(id, companyId, userId);

      sendSuccessWithDates(res, template, 'Template retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Create a new template
   * POST /templates/company/:companyId
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const template = await templateService.create(companyId, userId, req.body);

      sendCreatedWithDates(res, template, 'Template created successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Update a template
   * PUT /templates/company/:companyId/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const template = await templateService.update(id, companyId, userId, req.body);

      sendSuccessWithDates(res, template, 'Template updated successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Autosave template (partial update)
   * PATCH /templates/company/:companyId/:id/autosave
   */
  async autosave(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const mergedSchema = await templateService.autosave(
        id,
        companyId,
        userId,
        req.body.template_schema
      );

      sendSuccess(res, { template_schema: mergedSchema }, 'Template autosaved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Validate template for publishing
   * POST /templates/company/:companyId/:id/validate
   */
  async validate(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const validation = await templateService.validate(id, companyId, userId);

      sendSuccess(res, validation, 'Template validation completed');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Publish template
   * POST /templates/company/:companyId/:id/publish
   */
  async publish(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const template = await templateService.publish(id, companyId, userId);

      sendSuccessWithDates(res, template, 'Template published successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get version history
   * GET /templates/company/:companyId/:id/versions
   */
  async getVersions(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const versions = await templateService.getVersions(id, companyId, userId);

      sendSuccessWithDates(res, versions, 'Template versions retrieved');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Revert to a specific version
   * POST /templates/company/:companyId/:id/revert/:version
   */
  async revertToVersion(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const version = parseInt(req.params.version);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      const template = await templateService.revertToVersion(
        id,
        version,
        companyId,
        userId
      );

      sendSuccessWithDates(res, template, `Template reverted to version ${version}`);
    } catch (error) {
      next(error);
    }
  },

  /**
   * Clone a template (from preset or existing)
   * POST /templates/:companyId/:id/clone
   */
  async clone(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);
      const { name, description } = req.body;

      const template = await templateService.clone(
        id,
        companyId,
        userId,
        name,
        description
      );

      sendCreatedWithDates(res, template, 'Template cloned successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Clone a system preset template
   * POST /templates/presets/:id/clone
   */
  async clonePreset(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.body.company_id);
      const userId = parseInt(req.user!.id);
      const { name, description } = req.body;

      // Verify company access
      await templateService.verifyCompanyAccess(companyId, userId);

      const template = await templateService.clone(
        id,
        companyId,
        userId,
        name,
        description
      );

      sendCreatedWithDates(res, template, 'Preset template cloned successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Delete a template (soft delete)
   * DELETE /templates/company/:companyId/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const id = parseInt(req.params.id);
      const companyId = parseInt(req.params.companyId);
      const userId = parseInt(req.user!.id);

      await templateService.delete(id, companyId, userId);

      sendSuccess(res, null, 'Template deleted successfully');
    } catch (error) {
      next(error);
    }
  },
};
