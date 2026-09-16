import { z } from "zod";

export const MAX_MESSAGE_LENGTH = Number(process.env.MAX_MESSAGE_LENGTH ?? 3000);
export const MAX_SUBJECT_LENGTH = 200;

export const levelEnum = z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]);

export const taskInputSchema = z.object({
  title: z.string().trim().min(3).max(200),
  slug: z
    .string()
    .trim()
    .toLowerCase()
    .min(3)
    .max(80)
    .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, {
      message:
        "Der Link-Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.",
    }),
  instructions: z.string().trim().min(10).max(4000),
  student_role: z.string().trim().min(1).max(200),
  recipient_role: z.string().trim().min(1).max(200),
  recipient_name: z.string().trim().min(1).max(200),
  recipient_email: z.string().trim().email().max(200),
  background: z.string().trim().max(4000).default(""),
  required_points: z.array(z.string().trim().min(1).max(300)).max(20).default([]),
  evaluation_criteria: z
    .array(z.string().trim().min(1).max(300))
    .max(20)
    .default([]),
  level: levelEnum.default("B1"),
  language: z.string().trim().min(2).max(50).default("English"),
  max_messages: z.number().int().min(1).max(20).default(6),
  feedback_enabled: z.boolean().default(true),
  active: z.boolean().default(true),
});

export const createSessionSchema = z.object({
  slug: z.string().trim().min(1).max(80),
});

export const sendMessageSchema = z.object({
  session_id: z.string().uuid(),
  subject: z.string().trim().max(MAX_SUBJECT_LENGTH).default(""),
  content: z
    .string()
    .trim()
    .min(1, "Die E-Mail darf nicht leer sein.")
    .max(MAX_MESSAGE_LENGTH, `Die E-Mail darf maximal ${MAX_MESSAGE_LENGTH} Zeichen lang sein.`),
});

export const requestFeedbackSchema = z.object({
  session_id: z.string().uuid(),
});
