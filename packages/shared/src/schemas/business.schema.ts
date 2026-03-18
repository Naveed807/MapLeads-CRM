import { z } from 'zod';

export const createBusinessSchema = z.object({
  name:     z.string().min(1).max(255),
  category: z.string().max(100).optional(),
  phone:    z.string().max(30).optional(),
  email:    z.string().email().optional().or(z.literal('')),
  address:  z.string().max(500).optional(),
  website:  z.string().url().optional().or(z.literal('')),
  mapsUrl:  z.string().url().optional().or(z.literal('')),
  rating:   z.string().max(10).optional(),
  reviews:  z.string().max(20).optional(),
  hours:    z.string().max(200).optional(),
});

export const updateContactStatusSchema = z.object({
  status: z.enum([
    'NOT_CONTACTED', 'CONTACTED', 'REPLIED',
    'CONVERTED', 'NOT_INTERESTED', 'NOT_ON_WHATSAPP',
  ]),
});

export const updateNoteSchema = z.object({
  note: z.string().max(2000),
});

export const updateTagsSchema = z.object({
  tags: z.array(z.string().max(50)).max(20),
});

export const bulkStatusSchema = z.object({
  ids:    z.array(z.string()).min(1).max(500),
  status: z.enum([
    'NOT_CONTACTED', 'CONTACTED', 'REPLIED',
    'CONVERTED', 'NOT_INTERESTED', 'NOT_ON_WHATSAPP',
  ]),
});

export const bulkDeleteSchema = z.object({
  ids: z.array(z.string()).min(1).max(500),
});

export const businessQuerySchema = z.object({
  page:    z.coerce.number().int().positive().default(1),
  perPage: z.coerce.number().int().positive().max(100).default(20),
  search:  z.string().optional(),
  status:  z.string().optional(),
  tag:     z.string().optional(),
  sortBy:  z.enum(['importedAt', 'name', 'createdAt']).default('importedAt'),
  sortDir: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateBusinessInput      = z.infer<typeof createBusinessSchema>;
export type UpdateContactStatusInput = z.infer<typeof updateContactStatusSchema>;
export type UpdateNoteInput          = z.infer<typeof updateNoteSchema>;
export type UpdateTagsInput          = z.infer<typeof updateTagsSchema>;
export type BulkStatusInput          = z.infer<typeof bulkStatusSchema>;
export type BulkDeleteInput          = z.infer<typeof bulkDeleteSchema>;
export type BusinessQuery            = z.infer<typeof businessQuerySchema>;
