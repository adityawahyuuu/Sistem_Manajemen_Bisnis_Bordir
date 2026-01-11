import dotenv from 'dotenv';

dotenv.config();

export const emailConfig = {
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Embroidery Business System',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@embroidery.com',
  },
};

export const otpConfig = {
  expiryMinutes: parseInt(process.env.OTP_EXPIRY_MINUTES || '10'),
  length: 6,
};
