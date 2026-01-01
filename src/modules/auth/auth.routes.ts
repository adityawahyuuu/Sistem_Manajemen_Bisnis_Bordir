import { Router } from 'express';
import { authController } from './controllers/auth.controller';
import { validate, authMiddleware, requireAdmin } from '../../middleware';
import { loginSchema, registerSchema, refreshTokenSchema, createProfileSchema, setRoleSchema } from './validators/auth.validators';

const router = Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - repeat_password
 *               - name
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 pattern: '^[a-zA-Z0-9]{8,30}$'
 *                 minLength: 8
 *                 maxLength: 30
 *                 description: Alphanumeric password (8-30 characters)
 *                 example: Password123
 *               repeat_password:
 *                 type: string
 *                 description: Must match password
 *                 example: Password123
 *               name:
 *                 type: string
 *                 pattern: '^[a-zA-Z]{4,100}$'
 *                 minLength: 4
 *                 maxLength: 100
 *                 description: Name with letters only (4-100 characters)
 *                 example: JohnDoe
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error or email already exists
 */
router.post('/register', validate(registerSchema), authController.register);

export default router;
