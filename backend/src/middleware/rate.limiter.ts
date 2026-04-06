import { rateLimit, Options, ipKeyGenerator } from "express-rate-limit";

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
  skipSuccessfulRequests: true,
  keyGenerator: (req: any) => {
    const email = req.body?.email?.toLowerCase() ?? "unknown";

    return `${ipKeyGenerator(req, {} as any)}-${email}`;
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
