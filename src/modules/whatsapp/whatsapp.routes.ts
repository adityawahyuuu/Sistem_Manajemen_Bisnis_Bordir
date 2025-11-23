import { Router } from 'express';
import { whatsappController } from './controllers/whatsapp.controller';
import { authMiddleware, requireAdmin } from '../../middleware';

const router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /whatsapp/initialize:
 *   post:
 *     summary: Initialize WhatsApp connection
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp initialization started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 type:
 *                   type: string
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     status:
 *                       type: string
 *                       enum: [connecting, connected]
 *                     qrCode:
 *                       type: string
 *                       description: Base64 QR code image
 */
router.post('/initialize', requireAdmin, whatsappController.initialize);

/**
 * @swagger
 * /whatsapp/status:
 *   get:
 *     summary: Get WhatsApp connection status
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp status retrieved
 */
router.get('/status', whatsappController.getStatus);

/**
 * @swagger
 * /whatsapp/pairing-code:
 *   post:
 *     summary: Request pairing code for mobile device
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number to pair (e.g., 08123456789)
 *     responses:
 *       200:
 *         description: Pairing code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 pairingCode:
 *                   type: string
 *                   description: 8-digit pairing code (e.g., ABCD-EFGH)
 */
router.post('/pairing-code', requireAdmin, whatsappController.requestPairingCode);

/**
 * @swagger
 * /whatsapp/clear-session:
 *   post:
 *     summary: Clear WhatsApp session and auth data
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Session cleared
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 cleared:
 *                   type: boolean
 *                   description: Whether session was cleared
 */
router.post('/clear-session', requireAdmin, whatsappController.clearSession);

/**
 * @swagger
 * /whatsapp/send:
 *   post:
 *     summary: Send a text message via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - message
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Phone number (e.g., 628123456789)
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Message sent successfully
 */
router.post('/send', whatsappController.sendMessage);

/**
 * @swagger
 * /whatsapp/send-document:
 *   post:
 *     summary: Send a document via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - phoneNumber
 *               - filePath
 *               - fileName
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               filePath:
 *                 type: string
 *               fileName:
 *                 type: string
 *               caption:
 *                 type: string
 *     responses:
 *       200:
 *         description: Document sent successfully
 */
router.post('/send-document', whatsappController.sendDocument);

/**
 * @swagger
 * /whatsapp/check/{phoneNumber}:
 *   get:
 *     summary: Check if phone number is registered on WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: phoneNumber
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Number check result
 */
router.get('/check/:phoneNumber', whatsappController.checkNumber);

/**
 * @swagger
 * /whatsapp/logout:
 *   post:
 *     summary: Logout from WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: WhatsApp logged out successfully
 */
router.post('/logout', requireAdmin, whatsappController.logout);

/**
 * @swagger
 * /whatsapp/send-invoice/{id}:
 *   post:
 *     summary: Send invoice PDF via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Invoice ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *                 description: Override customer phone number
 *               message:
 *                 type: string
 *                 description: Custom message/caption
 *     responses:
 *       200:
 *         description: Invoice sent via WhatsApp
 */
router.post('/send-invoice/:id', whatsappController.sendInvoice);

/**
 * @swagger
 * /whatsapp/send-receipt/{id}:
 *   post:
 *     summary: Send receipt PDF via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Receipt ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Receipt sent via WhatsApp
 */
router.post('/send-receipt/:id', whatsappController.sendReceipt);

/**
 * @swagger
 * /whatsapp/send-waybill/{id}:
 *   post:
 *     summary: Send waybill PDF via WhatsApp
 *     tags: [WhatsApp]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Waybill ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Waybill sent via WhatsApp
 */
router.post('/send-waybill/:id', whatsappController.sendWaybill);

export default router;
