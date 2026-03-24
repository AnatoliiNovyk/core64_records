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
  message: z.string().min(1)
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
