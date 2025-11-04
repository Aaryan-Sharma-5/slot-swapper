import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const createEventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  startTime: z.string().datetime('Invalid start time'),
  endTime: z.string().datetime('Invalid end time'),
}).refine((data) => new Date(data.endTime) > new Date(data.startTime), {
  message: 'End time must be after start time',
  path: ['endTime'],
});

export const updateEventStatusSchema = z.object({
  status: z.enum(['BUSY', 'SWAPPABLE'], {
    errorMap: () => ({ message: 'Status must be BUSY or SWAPPABLE' }),
  }),
});

export const swapRequestSchema = z.object({
  mySlotId: z.number().int().positive(),
  theirSlotId: z.number().int().positive(),
}).refine((data) => data.mySlotId !== data.theirSlotId, {
  message: 'Cannot swap a slot with itself',
});

export const swapResponseSchema = z.object({
  accept: z.boolean(),
});
