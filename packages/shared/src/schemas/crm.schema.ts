import { z } from 'zod';

export const createTemplateSchema = z.object({
  name: z.string().min(1).max(100),
  body: z.string().min(1).max(5000),
  type: z.enum(['whatsapp', 'email_subject', 'email_body']).default('whatsapp'),
});

export const updateTemplateSchema = createTemplateSchema.partial();

export const setReminderSchema = z.object({
  dueDate: z.string().datetime(),
  note:    z.string().max(500).optional(),
});

export const emailSettingSchema = z.object({
  serviceId:      z.string().max(100).optional(),
  templateId:     z.string().max(100).optional(),
  publicKey:      z.string().max(200).optional(),
  fromName:       z.string().max(100).optional(),
  defaultSubject: z.string().max(300).optional(),
  defaultBody:    z.string().max(5000).optional(),
});

export const sendEmailSchema = z.object({
  bizId:   z.string(),
  subject: z.string().min(1).max(300),
  body:    z.string().min(1).max(5000),
});

export const updateOrgSchema = z.object({
  name:     z.string().min(2).max(100).optional(),
  locale:   z.string().max(10).optional(),
  timezone: z.string().max(50).optional(),
});

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type UpdateTemplateInput = z.infer<typeof updateTemplateSchema>;
export type SetReminderInput    = z.infer<typeof setReminderSchema>;
export type EmailSettingInput   = z.infer<typeof emailSettingSchema>;
export type SendEmailInput      = z.infer<typeof sendEmailSchema>;
export type UpdateOrgInput      = z.infer<typeof updateOrgSchema>;
