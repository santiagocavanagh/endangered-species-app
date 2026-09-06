import { z } from "zod";
import { UserRole } from "../entities/user.entity";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(2).optional(),
  role: z.enum(UserRole).optional(),
  adminSecret: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    name: z.string().min(2).optional(),
    password: z.string().min(8).optional(),
    currentPassword: z.string().min(1).optional(),
  })
  .partial()
  .refine((data) => !(data.password && !data.currentPassword), {
    message: "Debe proporcionar la contraseña actual",
    path: ["currentPassword"],
  });

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
