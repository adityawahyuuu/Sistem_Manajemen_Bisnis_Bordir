import { AppError } from '../../../middleware';
import { prisma } from '../../../config/prisma';
import { hashingUtil } from '../../../shared/utils/hashing.util';

export const authService = {
  // async getProfile(userId: string) {
  //   const user = await userRepository.findById(userId);
  //   if (!user) {
  //     throw new AppError('User not found', 404);
  //   }

  //   return {
  //     id: user.id,
  //     email: user.email,
  //     full_name: user.full_name,
  //     role: user.role,
  //     created_at: user.created_at,
  //   };
  // },

  // async createUserProfile(userId: string, email: string, fullName: string) {
  //   const existingUser = await userRepository.findById(userId);
  //   if (existingUser) {
  //     return existingUser;
  //   }

  //   return userRepository.create(userId, {
  //     email,
  //     full_name: fullName,
  //     role: 'user',
  //   });
  // },

  // async setUserRole(userId: string, role: string) {
  //   await auth.setCustomUserClaims(userId, { role });
  //   await db.collection('users').doc(userId).update({ role, updated_at: new Date() });
  //   return { success: true };
  // },

  // async getAllUsers() {
  //   return userRepository.findAll();
  // },

  async checkIsAnyEmail(email: string) {
    var isAnyEmail = false;

    const result = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });
    
    if (result != null) {
      isAnyEmail = true;
    }
    
    return isAnyEmail;
  },

  async getUserByEmail(email: string) {
    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      return null;
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },

  async createUser(name: string, email: string, password: string) {
    // Hash password before storing
    const hashedPassword = await hashingUtil.hashPassword(password);

    const result = await prisma.users.create({
      data: {
        name: name,
        email: email,
        password: hashedPassword,
        is_active: false,
        created_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = result;

    return userWithoutPassword;
  },

  async activateUser(email: string) {
    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    if (user.is_active) {
      throw new AppError('User account is already active', 400);
    }

    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        is_active: true,
        updated_at: new Date(),
      },
    });

    return true;
  },

  // async login(email: string, password: string) {
  //   if (!firebaseConfig.apiKey) {
  //     throw new AppError('Firebase API key not configured', 500);
  //   }

  //   const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;

  //   const response = await fetch(url, {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json',
  //     },
  //     body: JSON.stringify({
  //       email,
  //       password,
  //       returnSecureToken: true,
  //     }),
  //   });

  //   const data = await response.json() as {
  //     idToken?: string;
  //     refreshToken?: string;
  //     expiresIn?: string;
  //     localId?: string;
  //     email?: string;
  //     error?: { message?: string };
  //   };

  //   if (!response.ok) {
  //     const errorMessage = data.error?.message || 'Authentication failed';

  //     // Map Firebase error messages to user-friendly messages
  //     const errorMap: Record<string, string> = {
  //       'EMAIL_NOT_FOUND': 'Email not found',
  //       'INVALID_PASSWORD': 'Invalid password',
  //       'USER_DISABLED': 'User account is disabled',
  //       'INVALID_LOGIN_CREDENTIALS': 'Invalid email or password',
  //     };

  //     throw new AppError(errorMap[errorMessage] || errorMessage, 401);
  //   }

  //   // Get user profile from Firestore
  //   const user = await userRepository.findById(data.localId!);

  //   return {
  //     token: data.idToken,
  //     refreshToken: data.refreshToken,
  //     expiresIn: data.expiresIn,
  //     user: user ? {
  //       id: user.id,
  //       email: user.email,
  //       full_name: user.name,
  //     } : {
  //       id: data.localId,
  //       email: data.email,
  //       full_name: null,
  //       role: 'user',
  //     },
  //   };
  // },

  async resetPassword(email: string, newPassword: string) {
    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Hash new password
    const hashedPassword = await hashingUtil.hashPassword(newPassword);

    // Update password
    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        password: hashedPassword,
        updated_at: new Date(),
      },
    });

    return true;
  },

  async login(email: string, password: string) {
    // Find user by email
    const user = await prisma.users.findFirst({
      where: {
        email: email,
      },
    });

    // OWASP: Return generic error message to prevent user enumeration
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check if account is active
    if (!user.is_active) {
      throw new AppError('Account is not activated. Please verify your email.', 403);
    }

    // Verify password using constant-time comparison
    const isPasswordValid = await hashingUtil.comparePassword(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last logged in timestamp
    await prisma.users.update({
      where: {
        id: user.id,
      },
      data: {
        last_logged_in_at: new Date(),
        updated_at: new Date(),
      },
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return userWithoutPassword;
  },
};
