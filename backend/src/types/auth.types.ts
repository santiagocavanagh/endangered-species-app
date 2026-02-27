import { Request } from "express";
import { JwtPayload } from "jsonwebtoken";

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
  };
}

export interface TokenPayload extends JwtPayload {
  id: number;
  email: string;
  role: string;
}
