// src/validation/user.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginUserSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
});

export type CreateUserDTO = z.infer<typeof createUserSchema>;
export type LoginUserDTO = z.infer<typeof loginUserSchema>;