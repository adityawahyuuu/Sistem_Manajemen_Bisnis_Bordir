import { prisma } from '../../config/prisma';
import { otpConfig } from '../../config/email.config';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../utils/logger.util';

export const otpService = {
  /**
   * Generate a random 6-digit OTP code
   */
  generateOTPCode(): string {
    const min = Math.pow(10, otpConfig.length - 1);
    const max = Math.pow(10, otpConfig.length) - 1;
    const otpCode = Math.floor(Math.random() * (max - min + 1)) + min;
    return otpCode.toString();
  },

  /**
   * Create and store OTP in database
   */
  async createOTP(email: string, purpose: string = 'email_verification'): Promise<string> {
    try {
      // Invalidate all previous unused OTPs for this email and purpose
      await prisma.otp_codes.updateMany({
        where: {
          email: email,
          purpose: purpose,
          is_used: false,
        },
        data: {
          is_used: true,
        },
      });

      // Generate new OTP
      const otpCode = this.generateOTPCode();
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + otpConfig.expiryMinutes);

      // Store OTP in database
      await prisma.otp_codes.create({
        data: {
          email: email,
          otp_code: otpCode,
          purpose: purpose,
          expires_at: expiresAt,
        },
      });

      logger.info(`OTP created for email: ${email}`);
      return otpCode;
    } catch (error: any) {
      logger.error('Failed to create OTP:', error);
      throw new AppError('Failed to generate verification code. Please try again.', 500);
    }
  },

  /**
   * Verify OTP code
   */
  async verifyOTP(email: string, otpCode: string, purpose: string = 'email_verification'): Promise<boolean> {
    try {
      const otp = await prisma.otp_codes.findFirst({
        where: {
          email: email,
          otp_code: otpCode,
          purpose: purpose,
          is_used: false,
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      if (!otp) {
        throw new AppError('Invalid or expired OTP code', 400);
      }

      // Check if OTP is expired
      if (new Date() > otp.expires_at) {
        throw new AppError('OTP code has expired. Please request a new one.', 400);
      }

      // Mark OTP as used
      await prisma.otp_codes.update({
        where: {
          id: otp.id,
        },
        data: {
          is_used: true,
        },
      });

      logger.info(`OTP verified successfully for email: ${email}`);
      return true;
    } catch (error: any) {
      if (error instanceof AppError) {
        throw error;
      }

      logger.error('Failed to verify OTP:', error);
      throw new AppError('Failed to verify OTP code. Please try again.', 500);
    }
  },

  /**
   * Clean up expired OTPs (can be run as a cron job)
   */
  async cleanupExpiredOTPs(): Promise<number> {
    try {
      const result = await prisma.otp_codes.deleteMany({
        where: {
          expires_at: {
            lt: new Date(),
          },
        },
      });

      logger.info(`Cleaned up ${result.count} expired OTP codes`);
      return result.count;
    } catch (error: any) {
      logger.error('Failed to cleanup expired OTPs:', error);
      return 0;
    }
  },

  /**
   * Resend OTP
   */
  async resendOTP(email: string, purpose: string = 'email_verification'): Promise<string> {
    // Check if there's a recent OTP (within last minute to prevent spam)
    const recentOTP = await prisma.otp_codes.findFirst({
      where: {
        email: email,
        purpose: purpose,
        created_at: {
          gte: new Date(Date.now() - 60000), // 1 minute ago
        },
      },
    });

    if (recentOTP) {
      throw new AppError('Please wait 1 minute before requesting a new OTP code', 429);
    }

    // Create new OTP
    return this.createOTP(email, purpose);
  },
};
