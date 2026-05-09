import { z } from "zod";
import { paginationQuerySchema } from "../../core/http/contracts";

export const listUsersQuerySchema = paginationQuerySchema;

export const userDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  role: z.string(),
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

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type ListUsersResponse = z.infer<typeof listUsersResponseSchema>;
