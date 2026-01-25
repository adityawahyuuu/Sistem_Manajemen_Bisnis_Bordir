import { Router } from 'express';
import { waybillController } from './controllers/waybill.controller';
import { validate, authMiddleware } from '../../middleware';
import {
  createWaybillSchema,
  updateWaybillSchema,
  waybillQuerySchema,
  companyIdParamSchema,
} from './validators/waybill.validator';

const router = Router();

router.use(authMiddleware);

// Waybills Routes
/**
 * @swagger
 * /waybills/{companyId}:
 *   get:
 *     summary: Get all waybills for a company
 *     tags: [Waybills]
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
 *         name: customer_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: invoice_id
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, in_transit, delivered]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Waybills retrieved successfully
 */
router.get(
  '/:companyId',
  validate(companyIdParamSchema, 'params'),
  validate(waybillQuerySchema, 'query'),
  waybillController.findAllByCompany
);

/**
 * @swagger
 * /waybills/{companyId}:
 *   post:
 *     summary: Create new waybill
 *     tags: [Waybills]
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
 *             type: object
 *             required:
 *               - customer_id
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               invoice_id:
 *                 type: integer
 *                 example: 1
 *                 description: If provided, items will be copied from invoice
 *               waybill_date:
 *                 type: string
 *                 format: date
 *               destination_address:
 *                 type: string
 *               destination_city:
 *                 type: string
 *               destination_province:
 *                 type: string
 *               vehicle_number:
 *                 type: string
 *                 example: B 1234 XYZ
 *               driver_name:
 *                 type: string
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - name
 *                     - quantity
 *                   properties:
 *                     name:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                     notes:
 *                       type: string
 *     responses:
 *       201:
 *         description: Waybill created successfully
 */
router.post(
  '/:companyId',
  validate(companyIdParamSchema, 'params'),
  validate(createWaybillSchema, 'body'),
  waybillController.create
);

/**
 * @swagger
 * /waybills/{companyId}/{id}:
 *   get:
 *     summary: Get waybill by ID
 *     tags: [Waybills]
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
 *         description: Waybill retrieved successfully
 */
router.get(
  '/:companyId/:id',
  validate(companyIdParamSchema, 'params'),
  waybillController.findById
);

/**
 * @swagger
 * /waybills/{companyId}/{id}:
 *   put:
 *     summary: Update waybill
 *     tags: [Waybills]
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
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               destination_address:
 *                 type: string
 *               destination_city:
 *                 type: string
 *               destination_province:
 *                 type: string
 *               vehicle_number:
 *                 type: string
 *               driver_name:
 *                 type: string
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [pending, in_transit, delivered]
 *     responses:
 *       200:
 *         description: Waybill updated successfully
 */
router.put(
  '/:companyId/:id',
  validate(companyIdParamSchema, 'params'),
  validate(updateWaybillSchema, 'body'),
  waybillController.update
);

/**
 * @swagger
 * /waybills/{companyId}/{id}:
 *   delete:
 *     summary: Delete waybill
 *     tags: [Waybills]
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
 *         description: Waybill deleted successfully
 */
router.delete(
  '/:companyId/:id',
  validate(companyIdParamSchema, 'params'),
  waybillController.delete
);

/**
 * @swagger
 * /waybills/{companyId}/{id}/generate:
 *   post:
 *     summary: Generate PDF document for waybill
 *     tags: [Waybills]
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
 *         description: Waybill PDF generated successfully
 */
router.post(
  '/:companyId/:id/generate',
  validate(companyIdParamSchema, 'params'),
  waybillController.generate
);

/**
 * @swagger
 * /waybills/{companyId}/{id}/download:
 *   get:
 *     summary: Download waybill PDF
 *     tags: [Waybills]
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
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 */
router.get(
  '/:companyId/:id/download',
  validate(companyIdParamSchema, 'params'),
  waybillController.download
);

/**
 * @swagger
 * /waybills/{companyId}/{id}/status:
 *   patch:
 *     summary: Update waybill status
 *     tags: [Waybills]
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
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, in_transit, delivered]
 *     responses:
 *       200:
 *         description: Waybill status updated successfully
 */
router.patch(
  '/:companyId/:id/status',
  validate(companyIdParamSchema, 'params'),
  waybillController.updateStatus
);

export default router;
