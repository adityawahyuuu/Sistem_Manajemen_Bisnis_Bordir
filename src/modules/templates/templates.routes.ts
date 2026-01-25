import { Router } from 'express';
import { templateController } from './controllers/template.controller';
import { templatePhotoController } from './controllers/template-photo.controller';
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
import { uploadTemplatePhoto } from '../../shared/utils/upload.util';

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
 * /templates/presets/{companyId}/defaults:
 *   get:
 *     summary: Get company templates (one per document type) - returns company's template or null
 *     tags: [Templates]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company templates retrieved (one for invoice, receipt, waybill if exists)
 */
router.get('/presets/:companyId/defaults',
  validate(companyIdParamSchema, 'params'),
  templateController.findDefaultPresets
);

/**
 * @swagger
 * /templates/presets/{id}/clone:
 *   post:
 *     summary: Clone a system preset template to your company
 *     description: Clone a system preset to company. Returns 409 if company already has a template for that document_type.
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
 *       409:
 *         description: Company already has a template for this document_type
 */
router.post(
  '/presets/:id/clone',
  validate(templateIdParamSchema, 'params'),
  validate(cloneTemplateSchema.keys({ company_id: require('joi').number().integer().positive().required() }), 'body'),
  templateController.clonePreset
);

// ============ Template Photo Routes ============
// NOTE: Photo routes must come before company template routes to avoid route conflicts

/**
 * @swagger
 * /templates/photos/{companyId}:
 *   get:
 *     summary: Get all template photos for a company
 *     tags: [Template Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Template photos retrieved
 */
router.get(
  '/photos/:companyId',
  validate(companyIdParamSchema, 'params'),
  templatePhotoController.findAll
);

/**
 * @swagger
 * /templates/photos/{companyId}/{id}:
 *   get:
 *     summary: Get template photo by ID
 *     tags: [Template Photos]
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
 *         description: Template photo retrieved
 */
router.get(
  '/photos/:companyId/:id',
  validate(templateWithCompanyParamsSchema, 'params'),
  templatePhotoController.findById
);

/**
 * @swagger
 * /templates/photos/{companyId}:
 *   post:
 *     summary: Upload a single template photo
 *     tags: [Template Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photo
 *             properties:
 *               photo:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, gif, webp - max 5MB)
 *     responses:
 *       201:
 *         description: Photo uploaded successfully
 *       400:
 *         description: Invalid file or no file uploaded
 */
router.post(
  '/photos/:companyId',
  validate(companyIdParamSchema, 'params'),
  uploadTemplatePhoto.single('photo'),
  templatePhotoController.upload
);

/**
 * @swagger
 * /templates/photos/{companyId}/multiple:
 *   post:
 *     summary: Upload multiple template photos
 *     tags: [Template Photos]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - photos
 *             properties:
 *               photos:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Image files (jpg, png, gif, webp - max 5MB each, max 10 files)
 *     responses:
 *       201:
 *         description: Photos uploaded successfully
 *       400:
 *         description: Invalid files or no files uploaded
 */
router.post(
  '/photos/:companyId/multiple',
  validate(companyIdParamSchema, 'params'),
  uploadTemplatePhoto.array('photos', 10),
  templatePhotoController.uploadMultiple
);

/**
 * @swagger
 * /templates/photos/{companyId}/{id}:
 *   delete:
 *     summary: Delete a template photo
 *     tags: [Template Photos]
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
 *         description: Photo deleted successfully
 *       404:
 *         description: Photo not found
 */
router.delete(
  '/photos/:companyId/:id',
  validate(templateWithCompanyParamsSchema, 'params'),
  templatePhotoController.delete
);

// ============ Company Template Routes ============

/**
 * @swagger
 * /templates/{companyId}:
 *   get:
 *     summary: Get all templates for a company (max 3 - one per document type)
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
 *         name: document_type
 *         schema:
 *           type: string
 *           enum: [invoice, receipt, waybill]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published]
 *     responses:
 *       200:
 *         description: Templates retrieved (max 3 templates - one per document type)
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
 *     summary: Create a new template (one per document type only)
 *     description: Each company can only have ONE template per document_type. Returns 409 if template for that document_type already exists.
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
 *       409:
 *         description: Template for this document_type already exists
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

// ============ Clone Routes ============

/**
 * @swagger
 * /templates/{companyId}/{id}/clone:
 *   post:
 *     summary: Clone a template (from preset or existing)
 *     description: Clone a template to company. Returns 409 if company already has a template for that document_type (not deleted).
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
 *         description: Source template ID (preset or existing template)
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
 *         description: Template cloned successfully
 *       409:
 *         description: Company already has a template for this document_type
 */
router.post(
  '/:companyId/:id/clone',
  validate(templateWithCompanyParamsSchema, 'params'),
  validate(cloneTemplateSchema, 'body'),
  templateController.clone
);

export default router;
