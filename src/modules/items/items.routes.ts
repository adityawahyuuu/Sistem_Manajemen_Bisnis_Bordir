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

// ─── Item CRUD ────────────────────────────────────────────────────────────────

/**
 * @swagger
 * /items/{companyId}:
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
router.get('/:companyId', itemController.getAllItems);

/**
 * @swagger
 * /items/{companyId}:
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
 *               - item_name
 *             properties:
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
router.post('/:companyId', validate(createItemSchema), itemController.createItem);

/**
 * @swagger
 * /items/{companyId}/{itemId}:
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
router.get('/:companyId/:itemId', itemController.getItemById);

/**
 * @swagger
 * /items/{companyId}/{itemId}:
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
 *     responses:
 *       200:
 *         description: Item updated successfully
 */
router.put('/:companyId/:itemId', validate(updateItemSchema), itemController.updateItem);

/**
 * @swagger
 * /items/{companyId}/{itemId}:
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
router.delete('/:companyId/:itemId', itemController.deleteItem);

// ─── Customer Items ───────────────────────────────────────────────────────────

/**
 * @swagger
 * /items/{companyId}/customer/{customerId}:
 *   get:
 *     summary: Get all items assigned to a customer (with custom price)
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
router.get('/:companyId/customer/:customerId', itemController.getCustomerItems);

/**
 * @swagger
 * /items/{companyId}/customer/{customerId}:
 *   post:
 *     summary: Assign an item to a customer with optional custom price
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
 *               - id
 *             properties:
 *               id:
 *                 type: integer
 *                 description: item_id
 *               custom_price:
 *                 type: number
 *                 description: Override harga standar item untuk customer ini
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Item assigned to customer successfully
 */
router.post('/:companyId/customer/:customerId', validate(addCustomerItemSchema), itemController.addItemToCustomer);

/**
 * @swagger
 * /items/{companyId}/customer/{customerId}/{customerItemId}:
 *   delete:
 *     summary: Remove an item assignment from a customer
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
router.delete('/:companyId/customer/:customerId/:customerItemId', itemController.removeItemFromCustomer);

export default router;
