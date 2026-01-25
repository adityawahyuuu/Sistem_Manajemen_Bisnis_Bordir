import { Router } from 'express';
import { receiptController } from './controllers/receipt.controller';
import { validate, authMiddleware } from '../../middleware';
import {
  createReceiptSchema,
  updateReceiptSchema,
  receiptQuerySchema,
  companyIdParamSchema,
} from './validators/receipt.validator';

const router = Router();

router.use(authMiddleware);

// Receipts Routes
/**
 * @swagger
 * /receipts/{companyId}:
 *   get:
 *     summary: Get all receipts for a company
 *     tags: [Receipts]
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
 *         name: payment_method
 *         schema:
 *           type: string
 *           enum: [cash, transfer, check, other]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Receipts retrieved successfully
 */
router.get(
  '/:companyId',
  validate(companyIdParamSchema, 'params'),
  validate(receiptQuerySchema, 'query'),
  receiptController.findAllByCompany
);

/**
 * @swagger
 * /receipts/{companyId}:
 *   post:
 *     summary: Create new receipt
 *     tags: [Receipts]
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
 *               - amount
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               invoice_id:
 *                 type: integer
 *                 example: 1
 *               receipt_date:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *                 example: 500000
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer, check, other]
 *                 default: cash
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
router.post(
  '/:companyId',
  validate(companyIdParamSchema, 'params'),
  validate(createReceiptSchema, 'body'),
  receiptController.create
);

/**
 * @swagger
 * /receipts/{companyId}/{id}:
 *   get:
 *     summary: Get receipt by ID
 *     tags: [Receipts]
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
 *         description: Receipt retrieved successfully
 */
router.get(
  '/:companyId/:id',
  validate(companyIdParamSchema, 'params'),
  receiptController.findById
);

/**
 * @swagger
 * /receipts/{companyId}/{id}:
 *   put:
 *     summary: Update receipt
 *     tags: [Receipts]
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
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer, check, other]
 *               description:
 *                 type: string
 *               received_by:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Receipt updated successfully
 */
router.put(
  '/:companyId/:id',
  validate(companyIdParamSchema, 'params'),
  validate(updateReceiptSchema, 'body'),
  receiptController.update
);

/**
 * @swagger
 * /receipts/{companyId}/{id}:
 *   delete:
 *     summary: Delete receipt
 *     tags: [Receipts]
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
 *         description: Receipt deleted successfully
 */
router.delete(
  '/:companyId/:id',
  validate(companyIdParamSchema, 'params'),
  receiptController.delete
);

/**
 * @swagger
 * /receipts/{companyId}/{id}/generate:
 *   post:
 *     summary: Generate PDF document for receipt
 *     tags: [Receipts]
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
 *         description: Receipt PDF generated successfully
 */
router.post(
  '/:companyId/:id/generate',
  validate(companyIdParamSchema, 'params'),
  receiptController.generate
);

/**
 * @swagger
 * /receipts/{companyId}/{id}/download:
 *   get:
 *     summary: Download receipt PDF
 *     tags: [Receipts]
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
  receiptController.download
);

export default router;
