import { prisma } from '../../config/prisma';
import { logger } from '../utils/logger.util';

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const ATTEMPT_WINDOW_MINUTES = 15;

export const loginAttemptService = {
  /**
   * Record a login attempt (success or failure)
   */
  async recordAttempt(
    email: string,
    ipAddress: string,
    userAgent: string | undefined,
    success: boolean,
    failureReason?: string
  ): Promise<void> {
    try {
      await prisma.login_attempts.create({
        data: {
          email: email,
          ip_address: ipAddress,
          user_agent: userAgent || null,
          success: success,
          failure_reason: failureReason || null,
        },
      });

      if (success) {
        logger.info(`Successful login attempt for email: ${email}`);
      } else {
        logger.warn(`Failed login attempt for email: ${email}, reason: ${failureReason}`);
      }
    } catch (error: any) {
      logger.error('Failed to record login attempt:', error);
    }
  },

  /**
   * Check if account is locked due to too many failed attempts
   * Returns true if account is locked
   */
  async isAccountLocked(email: string): Promise<boolean> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - ATTEMPT_WINDOW_MINUTES);

      // Get failed attempts in the window
      const failedAttempts = await prisma.login_attempts.count({
        where: {
          email: email,
          success: false,
          attempted_at: {
            gte: windowStart,
          },
        },
      });

      // Check if there's a successful login after failed attempts
      if (failedAttempts > 0) {
        const lastSuccessfulLogin = await prisma.login_attempts.findFirst({
          where: {
            email: email,
            success: true,
            attempted_at: {
              gte: windowStart,
            },
          },
          orderBy: {
            attempted_at: 'desc',
          },
        });

        // If there's a successful login, reset the count
        if (lastSuccessfulLogin) {
          return false;
        }
      }

      return failedAttempts >= MAX_LOGIN_ATTEMPTS;
    } catch (error: any) {
      logger.error('Failed to check account lock status:', error);
      return false; // Fail open for availability
    }
  },

  /**
   * Get remaining time until account unlocks (in minutes)
   */
  async getLockoutRemainingTime(email: string): Promise<number | null> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - LOCKOUT_DURATION_MINUTES);

      // Get oldest failed attempt in lockout window
      const oldestFailedAttempt = await prisma.login_attempts.findFirst({
        where: {
          email: email,
          success: false,
          attempted_at: {
            gte: windowStart,
          },
        },
        orderBy: {
          attempted_at: 'asc',
        },
      });

      if (!oldestFailedAttempt) {
        return null;
      }

      const unlockTime = new Date(oldestFailedAttempt.attempted_at);
      unlockTime.setMinutes(unlockTime.getMinutes() + LOCKOUT_DURATION_MINUTES);

      const now = new Date();
      const remainingMs = unlockTime.getTime() - now.getTime();
      const remainingMinutes = Math.ceil(remainingMs / 60000);

      return remainingMinutes > 0 ? remainingMinutes : 0;
    } catch (error: any) {
      logger.error('Failed to get lockout remaining time:', error);
      return null;
    }
  },

  /**
   * Get failed attempt count in current window
   */
  async getFailedAttemptCount(email: string): Promise<number> {
    try {
      const windowStart = new Date();
      windowStart.setMinutes(windowStart.getMinutes() - ATTEMPT_WINDOW_MINUTES);

      const count = await prisma.login_attempts.count({
        where: {
          email: email,
          success: false,
          attempted_at: {
            gte: windowStart,
          },
        },
      });

      return count;
    } catch (error: any) {
      logger.error('Failed to get failed attempt count:', error);
      return 0;
    }
  },

  /**
   * Clean up old login attempts (can be run as cron job)
   */
  async cleanupOldAttempts(daysToKeep: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.login_attempts.deleteMany({
        where: {
          attempted_at: {
            lt: cutoffDate,
          },
        },
      });

      logger.info(`Cleaned up ${result.count} old login attempts`);
      return result.count;
    } catch (error: any) {
      logger.error('Failed to cleanup old login attempts:', error);
      return 0;
    }
  },

  /**
   * Get lockout configuration
   */
  getConfig() {
    return {
      maxAttempts: MAX_LOGIN_ATTEMPTS,
      lockoutDurationMinutes: LOCKOUT_DURATION_MINUTES,
      attemptWindowMinutes: ATTEMPT_WINDOW_MINUTES,
    };
  },
};
