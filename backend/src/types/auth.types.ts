import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";
import { UserRole } from "../entities/user.entity";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: UserRole;
  };
}

export interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: UserRole;
  };
}

export interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: UserRole;
}
