import { z } from "zod";

export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export const updateProfileSchema = z
  .object({
    name: z.string().optional(),
    password: z.string().min(8).optional(),
    currentPassword: z.string().min(1).optional(),
  })
  .refine((data) => !(data.password && !data.currentPassword), {
    message: "Debe proporcionar la contraseña actual",
    path: ["currentPassword"],
  });

export type RegisterBody = z.infer<typeof registerSchema>;
export type LoginBody = z.infer<typeof loginSchema>;
export type UpdateProfileBody = z.infer<typeof updateProfileSchema>;
