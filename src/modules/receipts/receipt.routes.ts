import { Router } from 'express';
import { receiptController } from './controllers/receipt.controller';
import { validate, authMiddleware } from '../../middleware';
import Joi from 'joi';

const router = Router();
router.use(authMiddleware);

const createReceiptSchema = Joi.object({
  invoice_id: Joi.string(),
  customer_id: Joi.string().required(),
  receipt_date: Joi.date().iso(),
  amount: Joi.number().min(0).required(),
  payment_method: Joi.string().valid('cash', 'transfer', 'check').default('cash'),
  description: Joi.string().allow('', null),
  received_by: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

const updateReceiptSchema = Joi.object({
  amount: Joi.number().min(0),
  payment_method: Joi.string().valid('cash', 'transfer', 'check'),
  description: Joi.string().allow('', null),
  received_by: Joi.string().allow('', null),
  notes: Joi.string().allow('', null),
});

/**
 * @swagger
 * /receipts:
 *   get:
 *     summary: Get all receipts
 *     tags: [Receipts]
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
 *         description: List of receipts
 */
router.get('/', receiptController.findAll);

/**
 * @swagger
 * /receipts/{id}:
 *   get:
 *     summary: Get receipt by ID
 *     tags: [Receipts]
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
 *         description: Receipt details
 *       404:
 *         description: Receipt not found
 */
router.get('/:id', receiptController.findById);

/**
 * @swagger
 * /receipts:
 *   post:
 *     summary: Create a new receipt
 *     tags: [Receipts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - amount
 *             properties:
 *               invoice_id:
 *                 type: string
 *               customer_id:
 *                 type: string
 *               receipt_date:
 *                 type: string
 *                 format: date-time
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer, check]
 *               description:
 *                 type: string
 *               received_by:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Receipt created successfully
 */
router.post('/', validate(createReceiptSchema), receiptController.create);

/**
 * @swagger
 * /receipts/{id}:
 *   put:
 *     summary: Update receipt
 *     tags: [Receipts]
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
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer, check]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Receipt updated successfully
 */
router.put('/:id', validate(updateReceiptSchema), receiptController.update);

/**
 * @swagger
 * /receipts/{id}:
 *   delete:
 *     summary: Delete receipt
 *     tags: [Receipts]
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
 *         description: Receipt deleted successfully
 */
router.delete('/:id', receiptController.delete);

/**
 * @swagger
 * /receipts/{id}/generate:
 *   post:
 *     summary: Generate receipt PDF document
 *     tags: [Receipts]
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
 *         description: Receipt document generated successfully
 *       404:
 *         description: Receipt not found
 */
router.post('/:id/generate', receiptController.generate);

/**
 * @swagger
 * /receipts/{id}/download:
 *   get:
 *     summary: Download generated receipt document
 *     tags: [Receipts]
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
 *         description: Receipt document file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Receipt not found or document not generated
 */
router.get('/:id/download', receiptController.download);

export default router;
