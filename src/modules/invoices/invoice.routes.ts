import { Router } from 'express';
import { invoiceController } from './controllers/invoice.controller';
import { validate, authMiddleware } from '../../middleware';
import {
  createInvoiceSchema,
  updateInvoiceSchema,
  invoiceQuerySchema,
  companyIdParamSchema,
  createPaymentSchema,
  updatePaymentSchema,
} from './validators/invoice.validator';

const router = Router();

router.use(authMiddleware);

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
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: date_from
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invoices from this date (invoice_date >=)
 *       - in: query
 *         name: date_to
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter invoices up to this date (invoice_date <=)
 *       - in: query
 *         name: payment_status
 *         schema:
 *           type: string
 *           enum: [lunas, dp, belum_bayar]
 *         description: Filter by payment status (computed from receipts)
 *     responses:
 *       200:
 *         description: Invoices retrieved successfully
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
 *               invoice_date:
 *                 type: string
 *                 format: date
 *               due_date:
 *                 type: string
 *                 format: date
 *               po_number:
 *                 type: string
 *                 example: PO-2026-001
 *               tax_amount:
 *                 type: number
 *                 default: 0
 *               discount_amount:
 *                 type: number
 *                 default: 0
 *               shipping_cost:
 *                 type: number
 *                 default: 0
 *               notes:
 *                 type: string
 *               items:
 *                 type: array
 *                 minItems: 1
 *                 items:
 *                   type: object
 *                   required:
 *                     - item_id
 *                     - name
 *                     - quantity
 *                     - unit_price
 *                   properties:
 *                     item_id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     description:
 *                       type: string
 *                     quantity:
 *                       type: number
 *                     unit:
 *                       type: string
 *                       default: pcs
 *                     unit_price:
 *                       type: number
 *                     discount_type:
 *                       type: string
 *                       enum: [Rp, persen]
 *                       default: Rp
 *                       description: "'Rp' = nominal tetap, 'persen' = persentase dari subtotal item"
 *                     discount_amount:
 *                       type: number
 *                       default: 0
 *     responses:
 *       201:
 *         description: Invoice created successfully
 */
router.post('/:companyId', validate(companyIdParamSchema, 'params'), validate(createInvoiceSchema, 'body'), invoiceController.create);

/**
 * @swagger
 * /invoices/{companyId}/{id}:
 *   get:
 *     summary: Get invoice by ID (includes payment history)
 *     tags: [Invoices]
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
 *         description: Invoice retrieved successfully
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
 *               due_date:
 *                 type: string
 *                 format: date
 *               po_number:
 *                 type: string
 *               tax_amount:
 *                 type: number
 *               discount_amount:
 *                 type: number
 *               shipping_cost:
 *                 type: number
 *               notes:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [paid, cancelled]
 *     responses:
 *       200:
 *         description: Invoice updated successfully
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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice deleted successfully
 */
router.delete('/:companyId/:id', validate(companyIdParamSchema, 'params'), invoiceController.delete);

/**
 * @swagger
 * /invoices/{companyId}/{id}/payments:
 *   get:
 *     summary: Get payment history for an invoice (cicilan)
 *     tags: [Invoices]
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
 *         description: Payment history retrieved successfully
 */
router.get('/:companyId/:id/payments', validate(companyIdParamSchema, 'params'), invoiceController.getPaymentHistory);

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
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Invoice PDF generated successfully
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
router.get('/:companyId/:id/download', validate(companyIdParamSchema, 'params'), invoiceController.download);

/**
 * @swagger
 * /invoices/{companyId}/{id}/payments:
 *   post:
 *     summary: Add a payment installment to an invoice
 *     tags: [Invoices]
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
 *               - payment_date
 *               - amount
 *               - payment_method
 *             properties:
 *               payment_date:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer, check, other]
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment added successfully
 */
router.post('/:companyId/:id/payments', validate(companyIdParamSchema, 'params'), validate(createPaymentSchema, 'body'), invoiceController.addPayment);

/**
 * @swagger
 * /invoices/{companyId}/{id}/payments/{paymentId}:
 *   put:
 *     summary: Update an existing payment installment
 *     tags: [Invoices]
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
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payment_date:
 *                 type: string
 *                 format: date
 *               amount:
 *                 type: number
 *               payment_method:
 *                 type: string
 *                 enum: [cash, transfer, check, other]
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated successfully
 */
router.put('/:companyId/:id/payments/:paymentId', validate(companyIdParamSchema, 'params'), validate(updatePaymentSchema, 'body'), invoiceController.updatePayment);

/**
 * @swagger
 * /invoices/{companyId}/{id}/payments/{paymentId}:
 *   delete:
 *     summary: Delete a payment installment
 *     tags: [Invoices]
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
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 */
router.delete('/:companyId/:id/payments/:paymentId', validate(companyIdParamSchema, 'params'), invoiceController.deletePayment);

export default router;
