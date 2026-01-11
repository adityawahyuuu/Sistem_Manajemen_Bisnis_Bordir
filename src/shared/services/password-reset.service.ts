import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../utils/logger.util';
import crypto from 'crypto';

const RESET_TOKEN_EXPIRY_HOURS = 1; // 1 hour expiry as per OWASP recommendation
const MIN_REQUEST_INTERVAL_MS = 60000; // 1 minute between requests

export const passwordResetService = {
  /**
   * Generate cryptographically secure reset token
   * Uses crypto.randomBytes for secure random generation
   */
  generateResetToken(): string {
    // Generate 32 bytes (256 bits) of random data
    // Convert to hex string (64 characters)
    const token = crypto.randomBytes(32).toString('hex');
    return token;
  },

  /**
   * Create password reset token for user
   * Implements OWASP best practices:
   * - Cryptographically secure token generation
   * - Time-limited expiration
   * - Single-use tokens
   * - Rate limiting to prevent abuse
   *
   * @param email - User's email address
   * @returns Reset token (to be sent via email)
   */
  async createResetToken(email: string): Promise<string> {
    try {
      // Check for recent reset requests (rate limiting)
      const recentToken = await prisma.password_reset_tokens.findFirst({
        where: {
          email: email,
          created_at: {
            gte: new Date(Date.now() - MIN_REQUEST_INTERVAL_MS),
          },
        },
      });

      if (recentToken) {
        throw new AppError(
          'Please wait 1 minute before requesting another password reset',
          429
        );
      }

      // Invalidate all previous unused tokens for this email
      await prisma.password_reset_tokens.updateMany({
        where: {
          email: email,
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });

      // Generate new cryptographically secure token
      const resetToken = this.generateResetToken();

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + RESET_TOKEN_EXPIRY_HOURS);

      // Store token in database
      await prisma.password_reset_tokens.create({
        data: {
          email: email,
          token: resetToken,
          expires_at: expiresAt,
        },
      });

      logger.info(`Password reset token created for email: ${email}`);
      return resetToken;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to create reset token:', error);
      throw new AppError(
        'Failed to process password reset request. Please try again.',
        500
      );
    }
  },

  /**
   * Verify reset token validity
   * Checks:
   * - Token exists
   * - Token not expired
   * - Token not already used
   *
   * @param token - Reset token from URL/email
   * @returns Email associated with token
   */
  async verifyResetToken(token: string): Promise<string> {
    try {
      const resetToken = await prisma.password_reset_tokens.findFirst({
        where: {
          token: token,
          is_used: false,
        },
      });

      if (!resetToken) {
        throw new AppError(
          'Invalid or expired password reset token',
          400
        );
      }

      // Check if token is expired
      if (new Date() > resetToken.expires_at) {
        throw new AppError(
          'Password reset token has expired. Please request a new one.',
          400
        );
      }

      return resetToken.email;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to verify reset token:', error);
      throw new AppError('Failed to verify reset token. Please try again.', 500);
    }
  },

  /**
   * Mark reset token as used
   * Called after successful password reset
   *
   * @param token - Reset token to mark as used
   */
  async markTokenAsUsed(token: string): Promise<void> {
    try {
      await prisma.password_reset_tokens.updateMany({
        where: {
          token: token,
        },
        data: {
          is_used: true,
        },
      });

      logger.info('Password reset token marked as used');
    } catch (error: any) {
      logger.error('Failed to mark token as used:', error);
      throw new AppError('Failed to complete password reset. Please try again.', 500);
    }
  },

  /**
   * Clean up expired reset tokens (can be run as a cron job)
   */
  async cleanupExpiredTokens(): Promise<number> {
    try {
      const result = await prisma.password_reset_tokens.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired password reset tokens`);
      return result.count;
    } catch (error: any) {
      logger.error('Failed to cleanup expired tokens:', error);
      return 0;
    }
  },

  /**
   * Get token expiry time in hours
   */
  getTokenExpiryHours(): number {
    return RESET_TOKEN_EXPIRY_HOURS;
  },
};
