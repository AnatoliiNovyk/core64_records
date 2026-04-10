import { z } from "zod";
import { sendValidationError } from "../utils/apiError.js";

const languageCodeSchema = z.string().trim().toLowerCase().regex(/^[a-z]{2}(?:-[a-z]{2})?$/);

const releaseTranslationSchema = z.object({
  title: z.string().min(1).optional(),
  artist: z.string().min(1).optional(),
  genre: z.string().min(1).optional()
});

const artistTranslationSchema = z.object({
  name: z.string().min(1).optional(),
  genre: z.string().optional(),
  bio: z.string().optional()
});

const eventTranslationSchema = z.object({
  title: z.string().min(1).optional(),
  venue: z.string().optional(),
  description: z.string().optional()
});

const sponsorTranslationSchema = z.object({
  name: z.string().min(1).optional(),
  shortDescription: z.string().trim().max(120).optional(),
  short_description: z.string().trim().max(120).optional()
});

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
  ticketLink: z.string().optional().default(""),
  i18n: z.record(languageCodeSchema, releaseTranslationSchema).optional().default({})
});

export const artistSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(1),
  genre: z.string().optional().default(""),
  bio: z.string().optional().default(""),
  image: z.string().min(1),
  soundcloud: z.string().optional().default("#"),
  instagram: z.string().optional().default("#"),
  i18n: z.record(languageCodeSchema, artistTranslationSchema).optional().default({})
});

export const eventSchema = z.object({
  id: z.union([z.number(), z.string()]).optional(),
  title: z.string().min(1),
  date: z.string().min(1),
  time: z.string().optional().default(""),
  venue: z.string().optional().default(""),
  description: z.string().optional().default(""),
  image: z.string().min(1),
  ticketLink: z.string().optional().default(""),
  i18n: z.record(languageCodeSchema, eventTranslationSchema).optional().default({})
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
  sortOrder: z.number().int().min(0).max(9999).optional().default(0),
  i18n: z.record(languageCodeSchema, sponsorTranslationSchema).optional().default({})
});

export const settingsSchema = z.object({
  title: z.string().min(1),
  about: z.string().optional().default(""),
  mission: z.string().optional().default(""),
  heroSubtitleUk: z.string().trim().min(1).max(160).optional().default("Neurofunk • Drum & Bass • Breakbeat • Techstep"),
  heroSubtitleEn: z.string().trim().min(1).max(160).optional().default("Neurofunk • Drum & Bass • Breakbeat • Techstep"),
  email: z.string().email(),
  headerLogoUrl: z.string().trim().max(4000000).optional().default(""),
  footerLogoUrl: z.string().trim().max(4000000).optional().default(""),
  instagramUrl: z.string().optional().default("#"),
  youtubeUrl: z.string().optional().default("#"),
  soundcloudUrl: z.string().optional().default("#"),
  radioUrl: z.string().optional().default("#"),
  contactCaptchaEnabled: z.boolean().optional().default(false),
  contactCaptchaActiveProvider: z.enum(["none", "hcaptcha", "recaptcha_v2"]).optional().default("none"),
  contactCaptchaHcaptchaSiteKey: z.string().trim().max(1024).optional().default(""),
  contactCaptchaHcaptchaSecretKey: z.string().trim().max(4096).optional().default(""),
  contactCaptchaRecaptchaSiteKey: z.string().trim().max(1024).optional().default(""),
  contactCaptchaRecaptchaSecretKey: z.string().trim().max(4096).optional().default(""),
  contactCaptchaErrorMessage: z.string().trim().max(255).optional().default("Не вдалося пройти перевірку captcha."),
  contactCaptchaMissingTokenMessage: z.string().trim().max(255).optional().default("Підтвердіть, що ви не робот."),
  contactCaptchaInvalidDomainMessage: z.string().trim().max(255).optional().default("Відправка з цього домену заборонена."),
  contactCaptchaAllowedDomain: z.string().trim().max(255).optional().default(""),
  auditLatencyGoodMaxMs: z.number().int().min(50).max(5000).optional().default(300),
  auditLatencyWarnMaxMs: z.number().int().min(100).max(10000).optional().default(800)
}).superRefine((payload, ctx) => {
  if (!payload.contactCaptchaEnabled) return;

  const provider = payload.contactCaptchaActiveProvider;
  if (provider === "none") {
    ctx.addIssue({
      path: ["contactCaptchaActiveProvider"],
      code: z.ZodIssueCode.custom,
      message: "Provider is required when captcha is enabled"
    });
    return;
  }

  if (provider === "hcaptcha") {
    if (!payload.contactCaptchaHcaptchaSiteKey) {
      ctx.addIssue({
        path: ["contactCaptchaHcaptchaSiteKey"],
        code: z.ZodIssueCode.custom,
        message: "hCaptcha site key is required"
      });
    }
    if (!payload.contactCaptchaHcaptchaSecretKey) {
      ctx.addIssue({
        path: ["contactCaptchaHcaptchaSecretKey"],
        code: z.ZodIssueCode.custom,
        message: "hCaptcha secret key is required"
      });
    }
  }

  if (provider === "recaptcha_v2") {
    if (!payload.contactCaptchaRecaptchaSiteKey) {
      ctx.addIssue({
        path: ["contactCaptchaRecaptchaSiteKey"],
        code: z.ZodIssueCode.custom,
        message: "reCAPTCHA site key is required"
      });
    }
    if (!payload.contactCaptchaRecaptchaSecretKey) {
      ctx.addIssue({
        path: ["contactCaptchaRecaptchaSecretKey"],
        code: z.ZodIssueCode.custom,
        message: "reCAPTCHA secret key is required"
      });
    }
  }

  const domain = String(payload.contactCaptchaAllowedDomain || "").trim();
  if (domain && !/^[a-z0-9.-]+$/i.test(domain)) {
    ctx.addIssue({
      path: ["contactCaptchaAllowedDomain"],
      code: z.ZodIssueCode.custom,
      message: "Allowed domain must be a valid hostname"
    });
  }

  if (payload.auditLatencyWarnMaxMs <= payload.auditLatencyGoodMaxMs) {
    ctx.addIssue({
      path: ["auditLatencyWarnMaxMs"],
      code: z.ZodIssueCode.custom,
      message: "Warn threshold must be greater than good threshold"
    });
  }
});

const sectionKeySchema = z.enum(["releases", "artists", "events", "sponsors", "contact"]);

export const sectionSettingSchema = z.object({
  sectionKey: sectionKeySchema,
  sortOrder: z.number().int().min(1).max(999),
  isEnabled: z.boolean().optional().default(true),
  titleUk: z.string().trim().min(1).max(120),
  titleEn: z.string().trim().min(1).max(120),
  menuTitleUk: z.string().trim().min(1).max(80),
  menuTitleEn: z.string().trim().min(1).max(80)
});

export const sectionSettingsSchema = z.object({
  sections: z.array(sectionSettingSchema).min(1).max(20)
}).superRefine((payload, ctx) => {
  const sectionKeySet = new Set();
  const sortOrderSet = new Set();

  payload.sections.forEach((section, index) => {
    if (sectionKeySet.has(section.sectionKey)) {
      ctx.addIssue({
        path: ["sections", index, "sectionKey"],
        code: z.ZodIssueCode.custom,
        message: "Duplicate sectionKey is not allowed"
      });
    }
    sectionKeySet.add(section.sectionKey);

    if (sortOrderSet.has(section.sortOrder)) {
      ctx.addIssue({
        path: ["sections", index, "sortOrder"],
        code: z.ZodIssueCode.custom,
        message: "Duplicate sortOrder is not allowed"
      });
    }
    sortOrderSet.add(section.sortOrder);
  });
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
      return sendValidationError(res, result.error.flatten());
    }

    req.validatedBody = result.data;
    return next();
  };
}
