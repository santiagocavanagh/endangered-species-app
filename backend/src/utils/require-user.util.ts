import { AuthRequest, AuthenticatedRequest } from "../types/auth.types";
import { UnauthorizedError } from "../errors/http.error";

export function requireUser(
  req: AuthRequest,
): asserts req is AuthenticatedRequest {
  if (!req.user) {
    throw new UnauthorizedError("No autenticado");
  }
}
