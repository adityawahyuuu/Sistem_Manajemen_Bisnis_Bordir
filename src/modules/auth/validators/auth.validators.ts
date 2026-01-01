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
  email: Joi.string().email().required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{8,30}$')).required(),
  repeat_password: Joi.ref('password'),
  name: Joi.string().pattern(new RegExp('^[a-zA-Z]{4,100}$')).required(),
});

export const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});
