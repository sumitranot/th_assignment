import { z } from 'zod';

export const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isValidUuid = val => typeof val === 'string' && UUID_REGEX.test(val);

export const createDocumentSchema = {
  body: z.object({
    title: z
      .string({ required_error: 'Title is required' })
      .trim()
      .min(1, 'Title cannot be empty')
      .max(200, 'Title cannot exceed 200 characters'),
    description: z
      .string()
      .max(1000, 'Description cannot exceed 1000 characters')
      .optional()
      .nullable(),
    textContent: z.string().optional().nullable(),
  }),
};

export const updateStatusSchema = {
  body: z.object({
    status: z.enum(['approved', 'rejected'], {
      errorMap: () => ({
        message: 'Status must be either "approved" or "rejected"',
      }),
    }),
    comment: z
      .string()
      .max(1000, 'Review comment cannot exceed 1000 characters')
      .optional()
      .nullable(),
  }),
};

export const listDocumentsSchema = {
  query: z.object({
    status: z
      .enum(['pending', 'approved', 'rejected'], {
        errorMap: () => ({
          message: 'Status filter must be one of: pending, approved, rejected',
        }),
      })
      .optional(),
    page: z.coerce
      .number({ invalid_type_error: 'Page must be a number' })
      .int('Page must be an integer')
      .positive('Page must be greater than 0')
      .default(1),
    pageSize: z.coerce
      .number({ invalid_type_error: 'Page size must be a number' })
      .int('Page size must be an integer')
      .positive('Page size must be greater than 0')
      .max(50, 'Page size cannot exceed 50')
      .default(10),
  }),
};
