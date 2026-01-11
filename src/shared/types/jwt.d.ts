import { Role } from '../constants/roles.constant';

export interface JwtPayloadData {
  sub: string;
  email: string;
  role: Role;
}