import { z } from 'zod';

export const idSchema = z.string().min(1);

export const userRoleSchema = z.enum(['owner', 'admin', 'member', 'viewer']);

export const workspaceSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  slug: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const taskStatusSchema = z.enum(['todo', 'in_progress', 'done', 'cancelled']);

export const taskSchema = z.object({
  id: idSchema,
  title: z.string().min(1),
  description: z.string().optional(),
  status: taskStatusSchema,
  assigneeId: idSchema.optional(),
  projectId: idSchema,
  workspaceId: idSchema,
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const messageSchema = z.object({
  id: idSchema,
  channelId: idSchema,
  senderId: idSchema,
  content: z.string().min(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime().optional(),
});

export const docSchema = z.object({
  id: idSchema,
  workspaceId: idSchema,
  ownerId: idSchema,
  title: z.string().min(1),
  content: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const apiErrorSchema = z.object({
  code: z.string().min(1),
  message: z.string().min(1),
  details: z.record(z.string(), z.unknown()).optional(),
});

export const apiMetaSchema = z.object({
  requestId: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const createApiResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  z.object({
    success: z.boolean(),
    data: dataSchema.optional(),
    error: apiErrorSchema.optional(),
    meta: apiMetaSchema,
  });
