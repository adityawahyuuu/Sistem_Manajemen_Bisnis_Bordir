import jwt, { SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';
import { JwtPayloadData } from '../types/jwt';
import { prisma } from '../../config/prisma';
import { AppError } from '../../middleware/error.middleware';

class JwtService {
  private static readonly JWT_SECRET =
    process.env.JWT_SECRET || 'your-default-secret';
  private static readonly JWT_EXPIRES_IN =
    (process.env.JWT_EXPIRES_IN || '15m') as SignOptions['expiresIn'];
  private static readonly REFRESH_TOKEN_EXPIRES_DAYS = 7;

  /**
   * Generate access token (short-lived)
   */
  sign(payload: JwtPayloadData): string {
    const options: SignOptions = {
      expiresIn: JwtService.JWT_EXPIRES_IN,
    };

    return jwt.sign(payload, JwtService.JWT_SECRET, options);
  }

  /**
   * Verify access token
   */
  verify(token: string): JwtPayloadData {
    return jwt.verify(token, JwtService.JWT_SECRET) as JwtPayloadData;
  }

  /**
   * Generate refresh token (long-lived, stored in database)
   */
  async generateRefreshToken(userId: number): Promise<string> {
    // Generate cryptographically secure random token
    const token = crypto.randomBytes(64).toString('hex');

    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + JwtService.REFRESH_TOKEN_EXPIRES_DAYS);

    // Store in database
    await prisma.refresh_tokens.create({
      data: {
        user_id: userId,
        token,
        expires_at: expiresAt,
      },
    });

    return token;
  }

  /**
   * Verify and consume refresh token to generate new access token (with rotation)
   */
  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string; newRefreshToken: string; user: JwtPayloadData }> {
    // Find refresh token in database
    const storedToken = await prisma.refresh_tokens.findUnique({
      where: { token: refreshToken },
    });

    if (!storedToken) {
      throw new AppError('Invalid refresh token', 401);
    }

    // Token reuse detection: revoked token used again → revoke entire family
    if (storedToken.is_revoked) {
      await this.revokeAllUserTokens(storedToken.user_id);
      throw new AppError('Refresh token reuse detected. All sessions have been revoked.', 401);
    }

    if (new Date() > storedToken.expires_at) {
      throw new AppError('Refresh token has expired', 401);
    }

    // Get user data
    const user = await prisma.users.findUnique({
      where: { id: storedToken.user_id },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (!user.is_active) {
      throw new AppError('User account is not active', 403);
    }

    // Rotation: invalidate old token
    await this.revokeRefreshToken(refreshToken);

    // Generate new refresh token
    const newRefreshToken = await this.generateRefreshToken(user.id);

    // Generate new access token
    const payload: JwtPayloadData = {
      sub: user.id.toString(),
      email: user.email,
      role: user.role as any,
    };

    const accessToken = this.sign(payload);

    return { accessToken, newRefreshToken, user: payload };
  }

  /**
   * Revoke refresh token (for logout)
   */
  async revokeRefreshToken(refreshToken: string): Promise<void> {
    await prisma.refresh_tokens.updateMany({
      where: { token: refreshToken },
      data: { is_revoked: true },
    });
  }

  /**
   * Revoke all refresh tokens for a user
   */
  async revokeAllUserTokens(userId: number): Promise<void> {
    await prisma.refresh_tokens.updateMany({
      where: {
        user_id: userId,
        is_revoked: false,
      },
      data: { is_revoked: true },
    });
  }

  /**
   * Clean up expired tokens (should be run periodically)
   */
  async cleanupExpiredTokens(): Promise<void> {
    await prisma.refresh_tokens.deleteMany({
      where: {
        expires_at: {
          lt: new Date(),
        },
      },
    });
  }
}

export const jwtService = new JwtService();