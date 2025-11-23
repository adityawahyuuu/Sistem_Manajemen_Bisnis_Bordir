import { Router } from 'express';
import { invoiceController } from './controllers/invoice.controller';
import { validate, authMiddleware } from '../../middleware';
import { createInvoiceSchema, updateInvoiceSchema } from './validators/invoice.validator';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /invoices:
 *   get:
 *     summary: Get all invoices
 *     tags: [Invoices]
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
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, paid, cancelled]
 *     responses:
 *       200:
 *         description: List of invoices
 */
router.get('/', invoiceController.findAll);

/**
 * @swagger
 * /invoices/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
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
 *         description: Invoice details
 *       404:
 *         description: Invoice not found
 */
router.get('/:id', invoiceController.findById);

/**
 * @swagger
 * /invoices:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Invoice'
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 */
router.post('/', validate(createInvoiceSchema), invoiceController.create);

/**
 * @swagger
 * /invoices/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Invoices]
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
 *             $ref: '#/components/schemas/Invoice'
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       404:
 *         description: Invoice not found
 */
router.put('/:id', validate(updateInvoiceSchema), invoiceController.update);

/**
 * @swagger
 * /invoices/{id}:
 *   delete:
 *     summary: Delete invoice
 *     tags: [Invoices]
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
 *         description: Invoice deleted successfully
 *       404:
 *         description: Invoice not found
 */
router.delete('/:id', invoiceController.delete);

/**
 * @swagger
 * /invoices/{id}/generate:
 *   post:
 *     summary: Generate invoice PDF document
 *     tags: [Invoices]
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
 *         description: Invoice document generated successfully
 *       404:
 *         description: Invoice not found
 */
router.post('/:id/generate', invoiceController.generate);

/**
 * @swagger
 * /invoices/{id}/download:
 *   get:
 *     summary: Download generated invoice document
 *     tags: [Invoices]
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
 *         description: Invoice document file
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       404:
 *         description: Invoice not found or document not generated
 */
router.get('/:id/download', invoiceController.download);

export default router;
