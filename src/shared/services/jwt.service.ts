import jwt, { SignOptions } from 'jsonwebtoken';
import dotenv from 'dotenv';
import { JwtPayloadData } from '../types/jwt';

class JwtService {
  private static readonly JWT_SECRET = 
    process.env.JWT_SECRET || 'your-default-secret';
  private static readonly JWT_EXPIRES_IN = 
    (process.env.JWT_EXPIRES_IN || '1h') as SignOptions['expiresIn'];

  sign(payload: JwtPayloadData): string {
    const options: SignOptions = {
      expiresIn: JwtService.JWT_EXPIRES_IN,
    };

    return jwt.sign(payload, JwtService.JWT_SECRET, options);
  }

  verify(token: string): JwtPayloadData {
    return jwt.verify(token, JwtService.JWT_SECRET) as JwtPayloadData;
  }
}

export const jwtService = new JwtService();