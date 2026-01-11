import { Router } from 'express';
import { authController } from './controllers/auth.controller';
import { validate, authMiddleware, requireAdmin } from '../../middleware';
import {
  loginSchema,
  registerSchema,
  refreshTokenSchema,
  createProfileSchema,
  setRoleSchema,
  verifyEmailSchema,
  resendOTPSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './validators/auth.validators';

const router = Router();

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login to account
 *     tags: [Auth]
 *     description: Login with email and password. Implements OWASP authentication best practices including account lockout after 5 failed attempts.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 description: User email address
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 description: User password
 *                 example: Password123
 *     responses:
 *       200:
 *         description: Login successful
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
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       example: 1
 *                     name:
 *                       type: string
 *                       example: John Doe
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *                     is_active:
 *                       type: boolean
 *                       example: true
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-11T17:00:00.000Z"
 *                     updated_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-11T17:00:00.000Z"
 *                     last_logged_in_at:
 *                       type: string
 *                       format: date-time
 *                       example: "2024-01-11T17:00:00.000Z"
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid email or password
 *       403:
 *         description: Account not activated
 *       429:
 *         description: Account temporarily locked due to multiple failed login attempts
 */
router.post('/login', validate(loginSchema), authController.login);

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
 *                 maxLength: 255
 *                 description: Valid email address (max 255 characters)
 *                 example: user@example.com
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 30
 *                 description: Password must be 8-30 characters and contain at least one letter and one number
 *                 example: Password123
 *               repeat_password:
 *                 type: string
 *                 description: Must match password
 *                 example: Password123
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 255
 *                 description: User's full name (2-255 characters, spaces allowed)
 *                 example: John Doe
 *     responses:
 *       201:
 *         description: User registered successfully. Verification email sent.
 *       400:
 *         description: Validation error or email already exists
 *       409:
 *         description: Email already exists
 *       500:
 *         description: Failed to send verification email
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @swagger
 * /auth/verify-email:
 *   post:
 *     summary: Verify email with OTP code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - otp_code
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *               otp_code:
 *                 type: string
 *                 pattern: '^[0-9]{6}$'
 *                 description: 6-digit OTP code
 *                 example: "123456"
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Invalid or expired OTP code
 *       404:
 *         description: User not found
 */
router.post('/verify-email', validate(verifyEmailSchema), authController.verifyEmail);

/**
 * @swagger
 * /auth/resend-otp:
 *   post:
 *     summary: Resend OTP verification code
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Verification code resent successfully
 *       400:
 *         description: Email not found or already verified
 *       429:
 *         description: Please wait 1 minute before requesting a new OTP
 *       500:
 *         description: Failed to send verification email
 */
router.post('/resend-otp', validate(resendOTPSchema), authController.resendOTP);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset link
 *     tags: [Auth]
 *     description: Request a password reset link. Returns consistent message regardless of email existence (OWASP security best practice).
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 maxLength: 255
 *                 description: Email address associated with the account
 *                 example: user@example.com
 *     responses:
 *       200:
 *         description: Consistent response regardless of email existence (prevents user enumeration)
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
 *                   example: If an account exists with this email, you will receive a password reset link shortly.
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *       400:
 *         description: Validation error
 *       429:
 *         description: Too many requests. Please wait before requesting another reset.
 */
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password using token
 *     tags: [Auth]
 *     description: Reset password using the token received via email. Token is single-use and expires in 1 hour.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *               - repeat_password
 *             properties:
 *               token:
 *                 type: string
 *                 pattern: '^[a-f0-9]{64}$'
 *                 description: 64-character hexadecimal reset token from email
 *                 example: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2
 *               password:
 *                 type: string
 *                 minLength: 8
 *                 maxLength: 30
 *                 description: New password (8-30 characters, must contain at least one letter and one number)
 *                 example: NewPassword123
 *               repeat_password:
 *                 type: string
 *                 description: Must match password
 *                 example: NewPassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
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
 *                   example: Password has been reset successfully. You can now login with your new password.
 *                 data:
 *                   type: object
 *                   properties:
 *                     email:
 *                       type: string
 *                       example: user@example.com
 *       400:
 *         description: Invalid or expired token, or validation error
 *       404:
 *         description: User not found
 */
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

export default router;
