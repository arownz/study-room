import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const USER_ROLES = [
  "student",
  "teacher",
  "researcher",
  "professional",
  "self_learner",
] as const;

export const userRoleSchema = z.enum(USER_ROLES);
export type UserRole = z.infer<typeof userRoleSchema>;

export const listUsersQuerySchema = paginationQuerySchema;

export const userDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  role: z.string(),
  roleSelected: z.boolean(),
  emailVerified: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listUsersResponseSchema = z.object({
  items: z.array(userDtoSchema),
  page: z.object({
    limit: z.number().int(),
    offset: z.number().int(),
  }),
});

export const connectedAccountSchema = z.object({
  providerId: z.string(),
  accountId: z.string(),
  scope: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const meDtoSchema = userDtoSchema.extend({
  accounts: z.array(connectedAccountSchema),
});

export const updateMeRequestSchema = z
  .object({
    name: z.string().trim().min(1).max(120).optional(),
    avatar: z.string().url().max(2048).nullable().optional(),
    role: userRoleSchema.optional(),
    roleSelected: z.boolean().optional(),
  })
  .strict()
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required",
  });

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;
export type ConnectedAccount = z.infer<typeof connectedAccountSchema>;
export type MeDto = z.infer<typeof meDtoSchema>;
export type UpdateMeRequest = z.infer<typeof updateMeRequestSchema>;
