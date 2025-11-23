import { Router } from 'express';
import { waybillController } from './controllers/waybill.controller';
import { validate, authMiddleware } from '../../middleware';
import { createWaybillSchema, updateWaybillSchema } from './validators/waybill.validator';

const router = Router();
router.use(authMiddleware);

/**
 * @swagger
 * /waybills:
 *   get:
 *     summary: Get all waybills
 *     tags: [Waybills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of waybills
 */
router.get('/', waybillController.findAll);

/**
 * @swagger
 * /waybills/{id}:
 *   get:
 *     summary: Get waybill by ID
 *     tags: [Waybills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Waybill details
 *       404:
 *         description: Waybill not found
 */
router.get('/:id', waybillController.findById);

/**
 * @swagger
 * /waybills:
 *   post:
 *     summary: Create a new waybill
 *     tags: [Waybills]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Waybill'
 *     responses:
 *       201:
 *         description: Waybill created successfully
 */
router.post('/', validate(createWaybillSchema), waybillController.create);

/**
 * @swagger
 * /waybills/{id}:
 *   put:
 *     summary: Update waybill
 *     tags: [Waybills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Waybill'
 *     responses:
 *       200:
 *         description: Waybill updated successfully
 */
router.put('/:id', validate(updateWaybillSchema), waybillController.update);

/**
 * @swagger
 * /waybills/{id}:
 *   delete:
 *     summary: Delete waybill
 *     tags: [Waybills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Waybill deleted successfully
 */
router.delete('/:id', waybillController.delete);

/**
 * @swagger
 * /waybills/{id}/generate:
 *   post:
 *     summary: Generate waybill PDF document
 *     tags: [Waybills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Waybill document generated successfully
 *       404:
 *         description: Waybill not found
 */
router.post('/:id/generate', waybillController.generate);

/**
 * @swagger
 * /waybills/{id}/download:
 *   get:
 *     summary: Download generated waybill document
 *     tags: [Waybills]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Waybill document file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Waybill not found or document not generated
 */
router.get('/:id/download', waybillController.download);

export default router;
