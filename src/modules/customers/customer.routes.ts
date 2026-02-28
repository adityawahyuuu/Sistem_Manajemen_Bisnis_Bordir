import { Router } from 'express';
import { customerController } from './controllers/customer.controller';
import { validate, authMiddleware } from '../../middleware';
import { createCustomerSchema, updateCustomerSchema } from './validators/customer.validator';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * tags:
 *   name: Customers
 *   description: Customer management per company
 */

/**
 * @swagger
 * /customers/{companyId}:
 *   get:
 *     summary: Get all customers for a company
 *     tags: [Customers]
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
 *         name: search
 *         schema:
 *           type: string
 *         description: Search by name, company name, or email
 *     responses:
 *       200:
 *         description: Customers retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Company not found
 */
router.get('/:companyId', customerController.findAll);

/**
 * @swagger
 * /customers/{companyId}:
 *   post:
 *     summary: Create a new customer for a company
 *     tags: [Customers]
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
 *               - name
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               company_name:
 *                 type: string
 *                 example: PT. ABC
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               phone:
 *                 type: string
 *                 example: '081234567890'
 *               mobile_phone:
 *                 type: string
 *                 example: '081234567890'
 *               address:
 *                 type: string
 *                 example: Jl. Merdeka No. 123
 *               province_code:
 *                 type: string
 *                 example: '32'
 *                 description: "Code dari GET /master/provinces"
 *               city_code:
 *                 type: string
 *                 example: '3278'
 *                 description: "Code dari GET /master/cities?province_code=32"
 *               subdistrict_code:
 *                 type: string
 *                 example: '3278030'
 *                 description: "Code dari GET /master/subdistricts?city_code=3278"
 *               village_code:
 *                 type: string
 *                 example: '3278030005'
 *                 description: "Code dari GET /master/villages?subdistrict_code=3278030"
 *               postal_code:
 *                 type: string
 *                 example: '46181'
 *                 description: "Auto-fill dari GET /master/villages/:id"
 *     responses:
 *       201:
 *         description: Customer created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Company not found
 */
router.post('/:companyId', validate(createCustomerSchema), customerController.create);

/**
 * @swagger
 * /customers/{companyId}/{customerId}:
 *   get:
 *     summary: Get customer by ID
 *     tags: [Customers]
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
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Customer or company not found
 */
router.get('/:companyId/:customerId', customerController.findById);

/**
 * @swagger
 * /customers/{companyId}/{customerId}:
 *   put:
 *     summary: Update customer
 *     tags: [Customers]
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
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               company_name:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               mobile_phone:
 *                 type: string
 *               address:
 *                 type: string
 *               province_code:
 *                 type: string
 *                 example: '32'
 *                 description: "Code dari GET /master/provinces"
 *               city_code:
 *                 type: string
 *                 example: '3278'
 *                 description: "Code dari GET /master/cities?province_code=32"
 *               subdistrict_code:
 *                 type: string
 *                 example: '3278030'
 *                 description: "Code dari GET /master/subdistricts?city_code=3278"
 *               village_code:
 *                 type: string
 *                 example: '3278030005'
 *                 description: "Code dari GET /master/villages?subdistrict_code=3278030"
 *               postal_code:
 *                 type: string
 *                 example: '46181'
 *                 description: "Auto-fill dari GET /master/villages/:id"
 *     responses:
 *       200:
 *         description: Customer updated successfully
 *       400:
 *         description: Validation error
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Customer or company not found
 */
router.put('/:companyId/:customerId', validate(updateCustomerSchema), customerController.update);

/**
 * @swagger
 * /customers/{companyId}/{customerId}:
 *   delete:
 *     summary: Delete customer
 *     tags: [Customers]
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
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Customer ID
 *     responses:
 *       200:
 *         description: Customer deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         description: Customer or company not found
 */
router.delete('/:companyId/:customerId', customerController.delete);

export default router;
