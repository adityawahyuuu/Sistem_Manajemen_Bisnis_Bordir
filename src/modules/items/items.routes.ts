import { Router } from 'express';
import { itemController } from './controllers/item.controller';
import { validate, authMiddleware } from '../../middleware';
import {
  createItemSchema,
  updateItemSchema,
  addCustomerItemSchema,
} from './validators/item.validators';

const router = Router();

router.use(authMiddleware);

// Company Items Routes
/**
 * @swagger
 * /items/company/{companyId}:
 *   get:
 *     summary: Get all items for company
 *     tags: [Items]
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
 *         description: Items retrieved successfully
 */
router.get('/company/:companyId', itemController.getAllItems);

/**
 * @swagger
 * /items/company/{companyId}/{itemId}:
 *   get:
 *     summary: Get item by ID
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item retrieved successfully
 */
router.get('/company/:companyId/:itemId', itemController.getItemById);

/**
 * @swagger
 * /items/company/{companyId}:
 *   post:
 *     summary: Create new item
 *     tags: [Items]
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
 *               - item_code
 *               - item_name
 *             properties:
 *               item_code:
 *                 type: string
 *                 example: BRD001
 *               item_name:
 *                 type: string
 *                 example: Bordir Logo Perusahaan
 *               description:
 *                 type: string
 *               unit:
 *                 type: string
 *                 example: pcs
 *               unit_price:
 *                 type: number
 *                 example: 15000
 *     responses:
 *       201:
 *         description: Item created successfully
 */
router.post('/company/:companyId', validate(createItemSchema), itemController.createItem);

/**
 * @swagger
 * /items/company/{companyId}/{itemId}:
 *   put:
 *     summary: Update item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item_name:
 *                 type: string
 *               unit_price:
 *                 type: number
 *               is_active:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
router.put('/company/:companyId/:itemId', validate(updateItemSchema), itemController.updateItem);

/**
 * @swagger
 * /items/company/{companyId}/{itemId}:
 *   delete:
 *     summary: Delete item
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: itemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item deleted successfully
 */
router.delete('/company/:companyId/:itemId', itemController.deleteItem);

// Customer Items Routes
/**
 * @swagger
 * /items/customer/{companyId}/{customerId}:
 *   get:
 *     summary: Get all items for specific customer
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Customer items retrieved successfully
 */
router.get('/customer/:companyId/:customerId', itemController.getCustomerItems);

/**
 * @swagger
 * /items/customer/{companyId}/{customerId}:
 *   post:
 *     summary: Add item to customer with custom price
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: customerId
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
 *               - item_id
 *             properties:
 *               item_id:
 *                 type: integer
 *               custom_price:
 *                 type: number
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item added to customer successfully
 */
router.post('/customer/:companyId/:customerId', validate(addCustomerItemSchema), itemController.addItemToCustomer);

/**
 * @swagger
 * /items/customer/{companyId}/{customerId}/{customerItemId}:
 *   delete:
 *     summary: Remove item from customer
 *     tags: [Items]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: companyId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: customerId
 *         required: true
 *         schema:
 *           type: integer
 *       - in: path
 *         name: customerItemId
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Item removed from customer successfully
 */
router.delete('/customer/:companyId/:customerId/:customerItemId', itemController.removeItemFromCustomer);

export default router;
