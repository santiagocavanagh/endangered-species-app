import { rateLimit, Options } from "express-rate-limit";

const options: Partial<Options> = {
  standardHeaders: "draft-8",
  legacyHeaders: false,
};

const limiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  limit: 100,
  message: { error: "Demasiadas solicitudes, intenta más tarde" },
});

const loginLimiter = rateLimit({
  ...options,
  windowMs: 15 * 60 * 1000,
  limit: 5,
  keyGenerator: (req) => {
    const email = req.body?.email?.toLowerCase() ?? "unknown";
    return `${req.ip}-${email}`;
  },
  message: { error: "Demasiados intentos, intenta luego" },
});

const registerLimiter = rateLimit({
  ...options,
  windowMs: 60 * 60 * 1000,
  limit: 3,
  message: { error: "Intenta más tarde" },
});

export { limiter, loginLimiter, registerLimiter };
