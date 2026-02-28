import nodemailer, { Transporter } from 'nodemailer';
import { emailConfig } from '../../config/email.config';
import { AppError } from '../../middleware/error.middleware';
import { logger } from '../utils/logger.util';

class EmailService {
  private transporter: Transporter | null = null;

  private async getTransporter(): Promise<Transporter> {
    if (!this.transporter) {
      // Validate email configuration
      if (!emailConfig.auth.user || !emailConfig.auth.pass) {
        throw new AppError('Email configuration is incomplete. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables.', 500);
      }

      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.auth.user,
          pass: emailConfig.auth.pass,
        },
      });

      // Verify connection
      try {
        await this.transporter.verify();
        logger.info('Email service connected successfully');
      } catch (error: any) {
        logger.error('Email service connection failed:', error);
        throw new AppError('Failed to connect to email service. Please check your email configuration.', 500);
      }
    }

    return this.transporter;
  }

  async sendOTP(to: string, otpCode: string, userName: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to,
        subject: 'Email Verification - OTP Code',
        html: this.getOTPEmailTemplate(otpCode, userName),
      };

      await transporter.sendMail(mailOptions);
      logger.info(`OTP email sent successfully to ${to}`);
    } catch (error: any) {
      logger.error('Failed to send OTP email:', error);

      // Check for specific email errors
      if (error.code === 'EAUTH') {
        throw new AppError('Email authentication failed. Please check email credentials.', 500);
      }

      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        throw new AppError('Failed to connect to email server. Please try again later.', 503);
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to send verification email. Please try again later.', 500);
    }
  }

  async sendPasswordResetEmail(to: string, resetToken: string, userName: string, expiryHours: number, baseUrl?: string): Promise<void> {
    try {
      const transporter = await this.getTransporter();

      // Construct reset URL (use provided baseUrl, fallback to env, then localhost)
      const frontendUrl = baseUrl || process.env.FRONTEND_URL || 'http://localhost:5173';
      const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

      const mailOptions = {
        from: `"${emailConfig.from.name}" <${emailConfig.from.address}>`,
        to,
        subject: 'Password Reset Request',
        html: this.getPasswordResetEmailTemplate(resetUrl, userName, expiryHours),
      };

      await transporter.sendMail(mailOptions);
      logger.info(`Password reset email sent successfully to ${to}`);
    } catch (error: any) {
      logger.error('Failed to send password reset email:', error);

      // Check for specific email errors
      if (error.code === 'EAUTH') {
        throw new AppError('Email authentication failed. Please check email credentials.', 500);
      }

      if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
        throw new AppError('Failed to connect to email server. Please try again later.', 503);
      }

      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError('Failed to send password reset email. Please try again later.', 500);
    }
  }

  private getOTPEmailTemplate(otpCode: string, userName: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4A90E2;
            margin: 0;
          }
          .otp-code {
            background-color: #4A90E2;
            color: white;
            font-size: 32px;
            font-weight: bold;
            text-align: center;
            padding: 20px;
            border-radius: 8px;
            letter-spacing: 8px;
            margin: 20px 0;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background-color: #FFF3CD;
            border-left: 4px solid #FFC107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Email Verification</h1>
          </div>

          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>

            <p>Thank you for registering with <strong>${emailConfig.from.name}</strong>. To complete your registration, please use the following OTP code:</p>

            <div class="otp-code">
              ${otpCode}
            </div>

            <p>This code will expire in <strong>10 minutes</strong>.</p>

            <div class="warning">
              <strong>Security Notice:</strong> Never share this code with anyone. Our team will never ask for your OTP code.
            </div>

            <p>If you didn't request this verification code, please ignore this email.</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${emailConfig.from.name}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  private getPasswordResetEmailTemplate(resetUrl: string, userName: string, expiryHours: number): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .container {
            background-color: #f9f9f9;
            border-radius: 10px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #E94B3C;
            margin: 0;
          }
          .content {
            background-color: white;
            padding: 20px;
            border-radius: 8px;
          }
          .reset-button {
            display: block;
            width: 100%;
            max-width: 300px;
            margin: 30px auto;
            padding: 15px 30px;
            background-color: #E94B3C;
            color: white;
            text-align: center;
            text-decoration: none;
            border-radius: 8px;
            font-size: 16px;
            font-weight: bold;
          }
          .reset-button:hover {
            background-color: #D13C2E;
          }
          .footer {
            text-align: center;
            margin-top: 30px;
            font-size: 12px;
            color: #666;
          }
          .warning {
            background-color: #FFF3CD;
            border-left: 4px solid #FFC107;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .danger {
            background-color: #FFE5E5;
            border-left: 4px solid #E94B3C;
            padding: 15px;
            margin: 20px 0;
            border-radius: 4px;
          }
          .link-text {
            word-break: break-all;
            font-size: 12px;
            color: #666;
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Password Reset Request</h1>
          </div>

          <div class="content">
            <p>Hello <strong>${userName}</strong>,</p>

            <p>We received a request to reset your password for your <strong>${emailConfig.from.name}</strong> account.</p>

            <p>Click the button below to reset your password:</p>

            <a href="${resetUrl}" class="reset-button" rel="noreferrer">Reset Password</a>

            <div class="warning">
              <strong>Link expires in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}</strong><br>
              This password reset link will expire in ${expiryHours} hour${expiryHours > 1 ? 's' : ''}. If you need a new link, please request another password reset.
            </div>

            <div class="danger">
              <strong>Security Notice:</strong>
              <ul style="margin: 10px 0; padding-left: 20px;">
                <li>Never share this link with anyone</li>
                <li>Our team will never ask for your password</li>
                <li>If you didn't request this reset, please ignore this email and secure your account</li>
              </ul>
            </div>

            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p class="link-text">${resetUrl}</p>

            <p style="margin-top: 30px;">If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
          </div>

          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} ${emailConfig.from.name}. All rights reserved.</p>
            <p>This is an automated email. Please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `;
  }
}

export const emailService = new EmailService();
