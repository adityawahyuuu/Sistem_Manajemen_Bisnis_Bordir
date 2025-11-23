export interface User {
  id: string;
  email: string;
  password_hash: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  full_name: string;
  role?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    full_name: string;
    role: string;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: string;
}
