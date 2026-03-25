import { z } from "zod";

export const releaseSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  title: z.string().min(1),
  artist: z.string().min(1),
  genre: z.string().min(1),
  releaseType: z.enum(["single", "ep", "album"]).optional().default("single"),
  releaseDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  year: z.string().optional().default(""),
  image: z.string().min(1),
  link: z.string().optional().default("#"),
  ticketLink: z.string().optional().default("")
});

export const artistSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1),
  genre: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  image: z.string().min(1),
  soundcloud: z.string().optional().default("#"),
  instagram: z.string().optional().default("#")
});

export const eventSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().optional().default(""),
  venue: z.string().optional().default(""),
  description: z.string().optional().default(""),
  image: z.string().min(1),
  ticketLink: z.string().optional().default("")
});

export const sponsorSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1),
  shortDescription: z.string().trim().max(120).refine((value) => {
    if (!value) return true;
    const words = value.split(/\s+/).filter(Boolean);
    return words.length >= 3 && words.length <= 5;
  }, {
    message: "shortDescription must contain 3 to 5 words"
  }).optional().default(""),
  logo: z.string().min(1),
  link: z.string().optional().default("#"),
  sortOrder: z.number().int().min(0).max(9999).optional().default(0)
});

export const settingsSchema = z.object({
  title: z.string().min(1),
  about: z.string().optional().default(""),
  mission: z.string().optional().default(""),
  email: z.string().email(),
  instagramUrl: z.string().optional().default("#"),
  youtubeUrl: z.string().optional().default("#"),
  soundcloudUrl: z.string().optional().default("#"),
  radioUrl: z.string().optional().default("#")
});

export const contactRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  subject: z.string().min(1),
  message: z.string().min(1),
  attachmentName: z.string().trim().max(255).optional().default(""),
  attachmentType: z.string().trim().max(120).optional().default(""),
  attachmentDataUrl: z.string().trim().max(15_000_000).optional().default(""),
  captchaToken: z.string().trim().max(4096).optional().default("")
}).superRefine((payload, ctx) => {
  const subject = String(payload.subject || "").trim().toLowerCase();
  const isDemo = subject === "демо запис" || subject === "demo" || subject.includes("демо");
  const hasAttachment = typeof payload.attachmentDataUrl === "string" && payload.attachmentDataUrl.startsWith("data:");

  if (payload.attachmentDataUrl && !hasAttachment) {
    ctx.addIssue({
      path: ["attachmentDataUrl"],
      code: z.ZodIssueCode.custom,
      message: "attachmentDataUrl must be a valid data URL"
    });
  }

  if (isDemo && !hasAttachment) {
    ctx.addIssue({
      path: ["attachmentDataUrl"],
      code: z.ZodIssueCode.custom,
      message: "Demo requests must include an attachment"
    });
  }
});

export const contactRequestStatusSchema = z.object({
  status: z.enum(["new", "in_progress", "done"])
});

export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Validation failed", details: result.error.flatten() });
    }

    req.validatedBody = result.data;
    return next();
  };
}
