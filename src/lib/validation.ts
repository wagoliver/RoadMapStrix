import { z } from 'zod'
import {
  SPRINT_DURATION_MIN,
  SPRINT_DURATION_MAX,
  ACTIVITY_DURATION_MIN,
  ACTIVITY_DURATION_MAX,
  DEFAULT_ACTIVITY_COLOR,
} from './constants'

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100),
  description: z.string().trim().max(500).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Invalid hex color'),
  sprintDuration: z.number()
    .int()
    .min(SPRINT_DURATION_MIN)
    .max(SPRINT_DURATION_MAX),
})

export const tagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
})

export const createActivitySchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(200),
  description: z.string().trim().max(1000).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).default(DEFAULT_ACTIVITY_COLOR),
  durationSprints: z.number()
    .int()
    .min(ACTIVITY_DURATION_MIN)
    .max(ACTIVITY_DURATION_MAX)
    .default(1),
  tags: z.array(tagSchema).max(20).default([]),
})

export const storedProjectSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string(),
  sprintDuration: z.number().int().positive(),
  createdAt: z.string().datetime({ offset: true }).or(z.string()),
})

export const storedActivitySchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  color: z.string(),
  durationSprints: z.number().int().positive(),
  startDate: z.string().nullable().optional(),
  rowIndex: z.number().nullable().optional(),
  isDelivered: z.boolean(),
  deliveryDate: z.string().nullable().optional(),
  deliveryLabel: z.string().nullable().optional(),
  projectId: z.string(),
  tags: z.array(z.object({
    id: z.string(),
    name: z.string(),
    color: z.string(),
    activityId: z.string(),
  })),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export type CreateProjectInput = z.infer<typeof createProjectSchema>
export type CreateActivityValidated = z.infer<typeof createActivitySchema>
