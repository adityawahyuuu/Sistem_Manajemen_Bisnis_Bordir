import { Router } from 'express';
import { templateController } from './controllers/template.controller';
import { validate, authMiddleware } from '../../middleware';
import {
  createTemplateSchema,
  updateTemplateSchema,
  autosaveTemplateSchema,
  cloneTemplateSchema,
  templateIdParamSchema,
  companyIdParamSchema,
  versionParamSchema,
  templateQuerySchema,
  templateWithCompanyParamsSchema,
} from './validators/template.validators';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============ System Preset Routes ============

/**
 * @swagger
 * /templates/presets:
 *   get:
 *     summary: Get all system preset templates
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *           enum: [invoice, receipt, waybill]
 *         description: Filter by document type
 *     responses:
 *       200:
 *         description: System preset templates retrieved
 */
router.get('/presets', templateController.findAllPresets);

/**
 * @swagger
 * /templates/presets/{id}/clone:
 *   post:
 *     summary: Clone a system preset template to your company
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Preset template ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - company_id
 *               - name
 *             properties:
 *               company_id:
 *                 type: integer
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template cloned successfully
 */
router.post(
  '/presets/:id/clone',
  validate(templateIdParamSchema, 'params'),
  validate(cloneTemplateSchema.keys({ company_id: require('joi').number().integer().positive().required() }), 'body'),
  templateController.clonePreset
);

// ============ Company Template Routes ============

/**
 * @swagger
 * /templates/{companyId}:
 *   get:
 *     summary: Get all templates for a company
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: document_type
 *         schema:
 *           type: string
 *           enum: [invoice, receipt, waybill]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Templates retrieved
 */
router.get(
  '/:companyId',
  validate(companyIdParamSchema, 'params'),
  validate(templateQuerySchema, 'query'),
  templateController.findAllByCompany
);

/**
 * @swagger
 * /templates/{companyId}:
 *   post:
 *     summary: Create a new template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateTemplate'
 *     responses:
 *       201:
 *         description: Template created
 */
router.post(
  '/:companyId',
  validate(companyIdParamSchema, 'params'),
  validate(createTemplateSchema, 'body'),
  templateController.create
);

/**
 * @swagger
 * /templates/{companyId}/{id}:
 *   get:
 *     summary: Get template by ID
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Template retrieved
 */
router.get(
  '/:companyId/:id',
  validate(templateWithCompanyParamsSchema, 'params'),
  templateController.findById
);

/**
 * @swagger
 * /templates/{companyId}/{id}:
 *   put:
 *     summary: Update a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateTemplate'
 *     responses:
 *       200:
 *         description: Template updated
 */
router.put(
  '/:companyId/:id',
  validate(templateWithCompanyParamsSchema, 'params'),
  validate(updateTemplateSchema, 'body'),
  templateController.update
);

/**
 * @swagger
 * /templates/{companyId}/{id}:
 *   delete:
 *     summary: Delete a template (soft delete)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Template deleted
 */
router.delete(
  '/:companyId/:id',
  validate(templateWithCompanyParamsSchema, 'params'),
  templateController.delete
);

// ============ Autosave & Publish Routes ============

/**
 * @swagger
 * /templates/{companyId}/{id}/autosave:
 *   patch:
 *     summary: Autosave template (partial update, no validation)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               template_schema:
 *                 type: object
 *                 description: Partial template schema to merge
 *     responses:
 *       200:
 *         description: Template autosaved, returns merged schema
 */
router.patch(
  '/:companyId/:id/autosave',
  validate(templateWithCompanyParamsSchema, 'params'),
  validate(autosaveTemplateSchema, 'body'),
  templateController.autosave
);

/**
 * @swagger
 * /templates/{companyId}/{id}/validate:
 *   post:
 *     summary: Validate template for publishing (without publishing)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Validation result with errors and warnings
 */
router.post(
  '/:companyId/:id/validate',
  validate(templateWithCompanyParamsSchema, 'params'),
  templateController.validate
);

/**
 * @swagger
 * /templates/{companyId}/{id}/publish:
 *   post:
 *     summary: Publish template (validates and increments version)
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Template published
 *       400:
 *         description: Validation errors
 */
router.post(
  '/:companyId/:id/publish',
  validate(templateWithCompanyParamsSchema, 'params'),
  templateController.publish
);

// ============ Version Routes ============

/**
 * @swagger
 * /templates/{companyId}/{id}/versions:
 *   get:
 *     summary: Get template version history
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Version history retrieved
 */
router.get(
  '/:companyId/:id/versions',
  validate(templateWithCompanyParamsSchema, 'params'),
  templateController.getVersions
);

/**
 * @swagger
 * /templates/{companyId}/{id}/revert/{version}:
 *   post:
 *     summary: Revert template to a specific version
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: version
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Template reverted
 */
router.post(
  '/:companyId/:id/revert/:version',
  validate(templateWithCompanyParamsSchema, 'params'),
  validate(versionParamSchema, 'params'),
  templateController.revertToVersion
);

// ============ Clone & Default Routes ============

/**
 * @swagger
 * /templates/{companyId}/{id}/clone:
 *   post:
 *     summary: Clone a template
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Template cloned
 */
router.post(
  '/:companyId/:id/clone',
  validate(templateWithCompanyParamsSchema, 'params'),
  validate(cloneTemplateSchema, 'body'),
  templateController.clone
);

/**
 * @swagger
 * /templates/{companyId}/{id}/set-default:
 *   patch:
 *     summary: Set template as default for its document type
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Template set as default
 */
router.patch(
  '/:companyId/:id/set-default',
  validate(templateWithCompanyParamsSchema, 'params'),
  templateController.setAsDefault
);

export default router;
