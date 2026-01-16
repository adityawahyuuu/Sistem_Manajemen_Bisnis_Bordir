import { Request, Response, NextFunction } from 'express';
import { authService } from '../services/auth.service';
import {
  sendAuthSuccessWithDates,
  sendBadRequest,
  sendCreatedWithDates,
  sendSuccessWithDates,
} from '../../../shared/utils/response.util';
import { otpService } from '../../../shared/services/otp.service';
import { emailService } from '../../../shared/services/email.service';
import { passwordResetService } from '../../../shared/services/password-reset.service';
import { loginAttemptService } from '../../../shared/services/login-attempt.service';
import { AppError } from '../../../middleware/error.middleware';
import { jwtService } from '../../../shared/services/jwt.service';
import { ROLES, Role } from '../../../shared/constants/roles.constant';
import { prisma } from '../../../config/prisma';

export const authController = {
  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'unknown';
      const userAgent = req.headers['user-agent'];

      // Check if account is locked
      const isLocked = await loginAttemptService.isAccountLocked(email);
      if (isLocked) {
        const remainingTime = await loginAttemptService.getLockoutRemainingTime(email);
        await loginAttemptService.recordAttempt(
          email,
          ipAddress,
          userAgent,
          false,
          'Account locked'
        );

        throw new AppError(
          `Account is temporarily locked due to multiple failed login attempts. Please try again in ${remainingTime} minutes.`,
          429
        );
      }

      // Attempt login
      try {
        const user = await authService.login(email, password);

        // Generate access token (short-lived: 15 minutes)
        const accessToken = jwtService.sign({
          sub: user.id.toString(),
          email: user.email,
          role: (user.role || ROLES.USER) as Role,
        });

        // Generate refresh token (long-lived: 7 days, stored in DB)
        const refreshToken = await jwtService.generateRefreshToken(user.id);

        // Record successful attempt
        await loginAttemptService.recordAttempt(
          email,
          ipAddress,
          userAgent,
          true
        );

        // Return user data with tokens
        sendAuthSuccessWithDates(
          res,
          user,
          {
            accessToken,
            refreshToken,
          },
          'Login successful'
        );
      } catch (error: any) {
        // Record failed attempt
        const failureReason = error instanceof AppError ? error.message : 'Invalid credentials';
        await loginAttemptService.recordAttempt(
          email,
          ipAddress,
          userAgent,
          false,
          failureReason
        );

        // Check if this failure causes lockout
        const failedCount = await loginAttemptService.getFailedAttemptCount(email);
        const config = loginAttemptService.getConfig();
        const remainingAttempts = config.maxAttempts - failedCount;

        if (remainingAttempts > 0 && remainingAttempts <= 2) {
          // Warn user about remaining attempts
          throw new AppError(
            `Invalid email or password. ${remainingAttempts} attempt(s) remaining before account lockout.`,
            401
          );
        }

        throw error;
      }
    } catch (error) {
      next(error);
    }
  },

  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const { name, email, password } = req.body;

      // Check if email already exists
      const emailExists = await authService.checkIsAnyEmail(email);
      if (emailExists) {
        return sendBadRequest(res, 'Email already exists');
      }

      // Create user with hashed password
      const user = await authService.createUser(name, email, password);

      // Generate OTP code
      const otpCode = await otpService.createOTP(email, 'email_verification');

      // Send OTP via email
      await emailService.sendOTP(email, otpCode, name);

      // Return user data without password (dates converted to Jakarta timezone)
      sendCreatedWithDates(
        res,
        {
          ...user,
          message: 'User registered successfully. Please check your email for verification code.'
        },
        'Registration successful. Verification email sent.'
      );
    } catch (error) {
      next(error);
    }
  },

  async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, otp_code } = req.body;

      // Verify OTP
      await otpService.verifyOTP(email, otp_code, 'email_verification');

      // Activate user account
      await authService.activateUser(email);

      sendSuccessWithDates(res, { email, is_active: true }, 'Email verified successfully. Your account is now active.');
    } catch (error) {
      next(error);
    }
  },

  async resendOTP(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      // Check if email exists
      const emailExists = await authService.checkIsAnyEmail(email);
      if (!emailExists) {
        return sendBadRequest(res, 'Email not found');
      }

      // Get user info
      const user = await authService.getUserByEmail(email);

      // Check if already verified
      if (user?.is_active) {
        return sendBadRequest(res, 'Email is already verified');
      }

      // Generate new OTP
      const otpCode = await otpService.resendOTP(email, 'email_verification');

      // Send OTP via email
      await emailService.sendOTP(email, otpCode, user?.name || 'User');

      sendSuccessWithDates(res, { email }, 'Verification code has been resent to your email.');
    } catch (error) {
      next(error);
    }
  },

  async refreshToken(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        return sendBadRequest(res, 'Refresh token is required');
      }

      // Verify refresh token and generate new access token
      const result = await jwtService.refreshAccessToken(refreshToken);

      sendSuccessWithDates(
        res,
        {
          accessToken: result.accessToken,
          user: {
            id: result.user.sub,
            email: result.user.email,
            role: result.user.role,
          },
        },
        'Token refreshed successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;

      if (refreshToken) {
        // Revoke the refresh token
        await jwtService.revokeRefreshToken(refreshToken);
      }

      sendSuccessWithDates(res, null, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  },

  async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { email } = req.body;

      // Check if user exists (following OWASP: return consistent message)
      const userExists = await authService.checkIsAnyEmail(email);

      if (userExists) {
        // Get user info
        const user = await authService.getUserByEmail(email);

        // Generate reset token
        const resetToken = await passwordResetService.createResetToken(email);

        // Send reset email
        const expiryHours = passwordResetService.getTokenExpiryHours();
        await emailService.sendPasswordResetEmail(
          email,
          resetToken,
          user?.name || 'User',
          expiryHours
        );
      }

      // OWASP Security: Always return same message to prevent user enumeration
      sendSuccessWithDates(
        res,
        { email },
        'If an account exists with this email, you will receive a password reset link shortly.'
      );
    } catch (error) {
      next(error);
    }
  },

  async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { token, password } = req.body;

      // Verify token and get email
      const email = await passwordResetService.verifyResetToken(token);

      // Reset password
      await authService.resetPassword(email, password);

      // Mark token as used
      await passwordResetService.markTokenAsUsed(token);

      sendSuccessWithDates(
        res,
        { email },
        'Password has been reset successfully. You can now login with your new password.'
      );
    } catch (error) {
      next(error);
    }
  },

  async profile(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = parseInt(req.user!.id);

      const user = await prisma.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          is_active: true,
          created_at: true,
          updated_at: true,
          last_logged_in_at: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      sendSuccessWithDates(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // async createProfile(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { full_name } = req.body;
  //     const result = await authService.createUserProfile(
  //       req.user!.id,
  //       req.user!.email,
  //       full_name
  //     );
  //     sendCreated(res, result, 'Profile created');
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  // async setRole(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const { userId } = req.params;
  //     const { role } = req.body;
  //     const result = await authService.setUserRole(userId, role);
  //     sendSuccess(res, result, 'Role updated');
  //   } catch (error) {
  //     next(error);
  //   }
  // },

  // async getAllUsers(req: Request, res: Response, next: NextFunction) {
  //   try {
  //     const users = await authService.getAllUsers();
  //     sendSuccess(res, users);
  //   } catch (error) {
  //     next(error);
  //   }
  // },
};
