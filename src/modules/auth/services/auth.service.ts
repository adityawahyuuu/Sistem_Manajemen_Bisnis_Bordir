import { auth, db } from '../../../database/firebase';
import { userRepository } from '../repositories/user.repository';
import { AppError } from '../../../middleware';
import { firebaseConfig } from '../../../config';

export const authService = {
  async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
      created_at: user.created_at,
    };
  },

  async createUserProfile(userId: string, email: string, fullName: string) {
    const existingUser = await userRepository.findById(userId);
    if (existingUser) {
      return existingUser;
    }

    return userRepository.create(userId, {
      email,
      full_name: fullName,
      role: 'user',
    });
  },

  async setUserRole(userId: string, role: string) {
    await auth.setCustomUserClaims(userId, { role });
    await db.collection('users').doc(userId).update({ role, updated_at: new Date() });
    return { success: true };
  },

  async getAllUsers() {
    return userRepository.findAll();
  },

  async login(email: string, password: string) {
    if (!firebaseConfig.apiKey) {
      throw new AppError('Firebase API key not configured', 500);
    }

    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        password,
        returnSecureToken: true,
      }),
    });

    const data = await response.json() as {
      idToken?: string;
      refreshToken?: string;
      expiresIn?: string;
      localId?: string;
      email?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      const errorMessage = data.error?.message || 'Authentication failed';

      // Map Firebase error messages to user-friendly messages
      const errorMap: Record<string, string> = {
        'EMAIL_NOT_FOUND': 'Email not found',
        'INVALID_PASSWORD': 'Invalid password',
        'USER_DISABLED': 'User account is disabled',
        'INVALID_LOGIN_CREDENTIALS': 'Invalid email or password',
      };

      throw new AppError(errorMap[errorMessage] || errorMessage, 401);
    }

    // Get user profile from Firestore
    const user = await userRepository.findById(data.localId!);

    return {
      token: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn,
      user: user ? {
        id: user.id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
      } : {
        id: data.localId,
        email: data.email,
        full_name: null,
        role: 'user',
      },
    };
  },

  async refreshToken(refreshToken: string) {
    if (!firebaseConfig.apiKey) {
      throw new AppError('Firebase API key not configured', 500);
    }

    const url = `https://securetoken.googleapis.com/v1/token?key=${firebaseConfig.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
      }),
    });

    const data = await response.json() as {
      id_token?: string;
      refresh_token?: string;
      expires_in?: string;
      error?: { message?: string };
    };

    if (!response.ok) {
      throw new AppError('Invalid refresh token', 401);
    }

    return {
      token: data.id_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
    };
  },
};
