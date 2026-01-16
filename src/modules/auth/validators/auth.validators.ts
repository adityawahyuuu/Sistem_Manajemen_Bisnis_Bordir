import Joi from 'joi';

export const createProfileSchema = Joi.object({
  name: Joi.string().min(2).max(255).required(),
});

export const setRoleSchema = Joi.object({
  role: Joi.string().valid('admin', 'user').required(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

export const registerSchema = Joi.object({
  // Email validation - max 255 sesuai database
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required',
    }),

  // Password validation - min 8, max 30, harus ada huruf dan angka
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp('(?=.*[a-zA-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 30 characters',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required',
    }),

  // Repeat password - harus match dengan password
  repeat_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Repeat password is required',
    }),

  // Name validation - min 2, max 255 sesuai database, allow spaces dan unicode
  name: Joi.string()
    .min(2)
    .max(255)
    .trim()
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 255 characters',
      'any.required': 'Name is required',
    }),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string()
    .min(1)
    .required()
    .messages({
      'any.required': 'Refresh token is required',
      'string.empty': 'Refresh token cannot be empty',
    }),
});

export const logoutSchema = Joi.object({
  refreshToken: Joi.string().optional(),
});

export const verifyEmailSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required',
    }),
  otp_code: Joi.string()
    .length(6)
    .pattern(/^[0-9]+$/)
    .required()
    .messages({
      'string.length': 'OTP code must be exactly 6 digits',
      'string.pattern.base': 'OTP code must contain only numbers',
      'any.required': 'OTP code is required',
    }),
});

export const resendOTPSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required',
    }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string()
    .email()
    .max(255)
    .required()
    .messages({
      'string.email': 'Email must be a valid email address',
      'string.max': 'Email must not exceed 255 characters',
      'any.required': 'Email is required',
    }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .length(64)
    .pattern(/^[a-f0-9]+$/)
    .required()
    .messages({
      'string.length': 'Invalid reset token format',
      'string.pattern.base': 'Invalid reset token format',
      'any.required': 'Reset token is required',
    }),
  password: Joi.string()
    .min(8)
    .max(30)
    .pattern(new RegExp('(?=.*[a-zA-Z])(?=.*[0-9])'))
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters long',
      'string.max': 'Password must not exceed 30 characters',
      'string.pattern.base': 'Password must contain at least one letter and one number',
      'any.required': 'Password is required',
    }),
  repeat_password: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Repeat password is required',
    }),
});
