import { Router } from 'express';
import { companyController } from './controllers/company.controller';
import { companySettingsController } from './controllers/company-settings.controller';
import { validate, authMiddleware } from '../../middleware';
import {
  createCompanySchema,
  updateCompanySchema,
  companyIdSchema,
} from './validators/company.validators';
import { updateSettingsSchema } from './validators/company-settings.validators';
import { uploadLogo } from '../../shared/utils/upload.util';

const router = Router();

// All company routes require authentication
router.use(authMiddleware);

/**
 * @swagger
 * /companies:
 *   get:
 *     summary: Get all companies for authenticated user
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Companies retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Companies retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       name:
 *                         type: string
 *                       domain:
 *                         type: string
 *                       address:
 *                         type: string
 *                       city:
 *                         type: string
 *                       province:
 *                         type: string
 *                       postal_code:
 *                         type: string
 *                       phone:
 *                         type: string
 *                       email:
 *                         type: string
 *                       is_active:
 *                         type: boolean
 *                       created_at:
 *                         type: string
 *                         format: date-time
 *                       updated_at:
 *                         type: string
 *                         format: date-time
 *       401:
 *         description: Unauthorized
 */
router.get('/', companyController.getAllCompanies);

/**
 * @swagger
 * /companies/{id}:
 *   get:
 *     summary: Get company by ID
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.get('/:id', validate(companyIdSchema, 'params'), companyController.getCompanyById);

/**
 * @swagger
 * /companies:
 *   post:
 *     summary: Create new company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
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
 *                 minLength: 2
 *                 maxLength: 255
 *                 example: PT Bordir Jaya
 *               domain:
 *                 type: string
 *                 example: bordirjaya.com
 *               address:
 *                 type: string
 *                 example: Jl. Merdeka No. 123
 *               city:
 *                 type: string
 *                 example: Tasikmalaya
 *               province:
 *                 type: string
 *                 example: Jawa Barat
 *               postal_code:
 *                 type: string
 *                 example: "46112"
 *               phone:
 *                 type: string
 *                 example: "0265123456"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: info@bordirjaya.com
 *     responses:
 *       201:
 *         description: Company created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', validate(createCompanySchema), companyController.createCompany);

/**
 * @swagger
 * /companies/{id}:
 *   put:
 *     summary: Update company
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               domain:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               province:
 *                 type: string
 *               postal_code:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Company updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.put('/:id', validate(companyIdSchema, 'params'), validate(updateCompanySchema), companyController.updateCompany);

/**
 * @swagger
 * /companies/{id}:
 *   delete:
 *     summary: Delete company (soft delete)
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.delete('/:id', validate(companyIdSchema, 'params'), companyController.deleteCompany);

// Company Logo Routes
/**
 * @swagger
 * /companies/{id}/logo:
 *   post:
 *     summary: Upload company logo
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - logo
 *             properties:
 *               logo:
 *                 type: string
 *                 format: binary
 *                 description: Image file (jpg, png, gif, webp - max 5MB)
 *     responses:
 *       200:
 *         description: Logo uploaded successfully
 *       400:
 *         description: Invalid file or no file uploaded
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.post(
  '/:id/logo',
  validate(companyIdSchema, 'params'),
  uploadLogo.single('logo'),
  companyController.uploadLogo
);

/**
 * @swagger
 * /companies/{id}/logo:
 *   get:
 *     summary: Get company logo
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Company logo image
 *         content:
 *           image/png:
 *             schema:
 *               type: string
 *               format: binary
 *           image/jpeg:
 *             schema:
 *               type: string
 *               format: binary
 *           image/webp:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company or logo not found
 */
router.get(
  '/:id/logo',
  validate(companyIdSchema, 'params'),
  companyController.getLogo
);

/**
 * @swagger
 * /companies/{id}/logo:
 *   delete:
 *     summary: Delete company logo
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *     responses:
 *       200:
 *         description: Logo deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found or logo not found
 */
router.delete('/:id/logo', validate(companyIdSchema, 'params'), companyController.deleteLogo);

// Company Settings Routes
/**
 * @swagger
 * /companies/{companyId}/settings:
 *   get:
 *     summary: Get company invoice settings
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Settings retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Company not found
 */
router.get('/:companyId/settings', companySettingsController.getSettings);

/**
 * @swagger
 * /companies/{companyId}/settings:
 *   put:
 *     summary: Update company invoice settings
 *     tags: [Companies]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               logo_url:
 *                 type: string
 *               primary_color:
 *                 type: string
 *                 example: "#000000"
 *               secondary_color:
 *                 type: string
 *                 example: "#666666"
 *               font_family:
 *                 type: string
 *                 example: Arial
 *               font_size:
 *                 type: integer
 *                 example: 12
 *               invoice_prefix:
 *                 type: string
 *                 example: INV
 *               show_company_logo:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Settings updated successfully
 */
router.put('/:companyId/settings', validate(updateSettingsSchema), companySettingsController.updateSettings);

export default router;
