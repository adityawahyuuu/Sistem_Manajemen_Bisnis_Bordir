import { Router } from 'express';
import { invoiceController } from './controllers/invoice.controller';
import { validate, authMiddleware } from '../../middleware';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
  companyIdParamSchema,
} from './validators/invoice.validator';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Invoices Routes
/**
 * @swagger
 * /invoices/{companyId}:
 *   get:
 *     summary: Get all invoices for a company
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, sent, paid, cancelled]
 *       - in: query
 *         name: customer_id
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by invoice number or customer name
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Company not found
 */
router.get('/:companyId', validate(companyIdParamSchema, 'params'), validate(invoiceQuerySchema, 'query'), invoiceController.findAllByCompany);

/**
 * @swagger
 * /invoices/{companyId}:
 *   post:
 *     summary: Create a new invoice
 *     tags: [Invoices]
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
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - customer_id
 *               - items
 *             properties:
 *               customer_id:
 *                 type: integer
 *                 example: 1
 *               invoice_date:
 *                 type: string
 *                 format: date
 *                 example: '2026-01-17'
 *               due_date:
 *                 type: string
 *                 format: date
 *                 example: '2026-02-17'
 *               tax_amount:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 50000
 *               discount_amount:
 *                 type: number
 *                 minimum: 0
 *                 default: 0
 *                 example: 10000
 *               notes:
 *                 type: string
 *                 example: Pembayaran via transfer
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   $ref: '#/components/schemas/InvoiceItem'
 *     responses:
 *       201:
 *         description: Invoice created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Company or customer not found
 */
router.post('/:companyId', validate(companyIdParamSchema, 'params'), validate(createInvoiceSchema, 'body'), invoiceController.create);

/**
 * @swagger
 * /invoices/{companyId}/{id}:
 *   get:
 *     summary: Get invoice by ID
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Invoice or company not found
 */
router.get('/:companyId/:id', validate(companyIdParamSchema, 'params'), invoiceController.findById);

/**
 * @swagger
 * /invoices/{companyId}/{id}:
 *   put:
 *     summary: Update invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               due_date:
 *                 type: string
 *                 format: date
 *               tax_amount:
 *                 type: number
 *                 minimum: 0
 *               discount_amount:
 *                 type: number
 *                 minimum: 0
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, sent, paid, cancelled]
 *     responses:
 *       200:
 *         description: Invoice updated successfully
 *       400:
 *         description: Validation error or cannot update paid/cancelled invoice
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Invoice or company not found
 */
router.put('/:companyId/:id', validate(companyIdParamSchema, 'params'), validate(updateInvoiceSchema, 'body'), invoiceController.update);

/**
 * @swagger
 * /invoices/{companyId}/{id}:
 *   delete:
 *     summary: Delete invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 *       400:
 *         description: Cannot delete invoice with linked receipts or waybills
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Invoice or company not found
 */
router.delete('/:companyId/:id', validate(companyIdParamSchema, 'params'), invoiceController.delete);

/**
 * @swagger
 * /invoices/{companyId}/{id}/generate:
 *   post:
 *     summary: Generate PDF document for invoice
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: Invoice PDF generated successfully
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
 *                   example: Invoice document generated successfully
 *                 data:
 *                   type: object
 *                   properties:
 *                     fileName:
 *                       type: string
 *                       example: invoice-INV-202601-0001.pdf
 *                     invoice:
 *                       $ref: '#/components/schemas/Invoice'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Invoice or company not found
 */
router.post('/:companyId/:id/generate', validate(companyIdParamSchema, 'params'), invoiceController.generate);

/**
 * @swagger
 * /invoices/{companyId}/{id}/download:
 *   get:
 *     summary: Download invoice PDF
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
 *     responses:
 *       200:
 *         description: PDF file download
 *         content:
 *           application/pdf:
 *             schema:
 *               type: string
 *               format: binary
 *       400:
 *         description: Invoice document not generated yet
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Invoice, company, or file not found
 */
router.get('/:companyId/:id/download', validate(companyIdParamSchema, 'params'), invoiceController.download);

/**
 * @swagger
 * /invoices/{companyId}/{id}/status:
 *   patch:
 *     summary: Update invoice status
 *     tags: [Invoices]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Company ID
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Invoice ID
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
 *                 enum: [draft, sent, paid, cancelled]
 *     responses:
 *       200:
 *         description: Invoice status updated successfully
 *       400:
 *         description: Cannot update cancelled invoice
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Invoice or company not found
 */
router.patch('/:companyId/:id/status', validate(companyIdParamSchema, 'params'), invoiceController.updateStatus);

export default router;
