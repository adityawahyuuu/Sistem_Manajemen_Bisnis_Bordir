import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashingUtil = {
  /**
   * Hash a plain text password
   * @param password - Plain text password
   * @returns Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    const hashedPassword = await bcrypt.hash(password, salt);
    return hashedPassword;
  },

  /**
   * Compare plain text password with hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns True if passwords match, false otherwise
   */
  async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(password, hashedPassword);
  },

  /**
   * Validate password strength
   * @param password - Plain text password
   * @returns True if password meets requirements
   */
  validatePasswordStrength(password: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }

    if (password.length > 30) {
      errors.push('Password must not exceed 30 characters');
    }

    if (!/[a-zA-Z]/.test(password)) {
      errors.push('Password must contain at least one letter');
    }

    if (!/[0-9]/.test(password)) {
      errors.push('Password must contain at least one number');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  },
};
