import type { CookieOptions } from "express";
import { ENV } from "../config/env.config";

export const AUTH_COOKIE_NAME = "token";

// Vida máxima que el navegador conserva la cookie; la expiración real la impone
// jwt.verify() contra el claim "exp" del propio token (ver JWT_EXPIRATION).
const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// sameSite "none" + secure es obligatorio cuando frontend y backend viven en dominios
// distintos en producción; en desarrollo "lax" alcanza y no exige HTTPS (secure=false).
function baseAuthCookieOptions(): CookieOptions {
  const isProd = ENV.NODE_ENV === "production";

  return {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? "none" : "lax",
    path: "/",
  };
}

export function getAuthCookieOptions(): CookieOptions {
  return { ...baseAuthCookieOptions(), maxAge: AUTH_COOKIE_MAX_AGE_MS };
}

// clearCookie debe recibir las mismas opciones (menos maxAge) que set para poder invalidarla.
export function getClearAuthCookieOptions(): CookieOptions {
  return baseAuthCookieOptions();
}
