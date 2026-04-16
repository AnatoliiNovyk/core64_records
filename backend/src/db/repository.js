import { pool } from "./pool.js";
import { config } from "../config.js";
import { resolveLanguage } from "../i18n/language.js";

const SECTION_SETTINGS_DEFAULTS = [
  {
    sectionKey: "releases",
    sortOrder: 1,
    isEnabled: true,
    titleUk: "ОСТАННІ РЕЛІЗИ",
    titleEn: "LATEST RELEASES",
    menuTitleUk: "РЕЛІЗИ",
    menuTitleEn: "RELEASES"
  },
  {
    sectionKey: "artists",
    sortOrder: 2,
    isEnabled: true,
    titleUk: "АРТИСТИ ЛЕЙБЛУ",
    titleEn: "LABEL ARTISTS",
    menuTitleUk: "АРТИСТИ",
    menuTitleEn: "ARTISTS"
  },
  {
    sectionKey: "events",
    sortOrder: 3,
    isEnabled: true,
    titleUk: "АФІША ПОДІЙ",
    titleEn: "EVENT SCHEDULE",
    menuTitleUk: "ПОДІЇ",
    menuTitleEn: "EVENTS"
  },
  {
    sectionKey: "sponsors",
    sortOrder: 4,
    isEnabled: true,
    titleUk: "СПОНСОРИ, ПАРТНЕРИ ТА ДРУЗІ",
    titleEn: "SPONSORS, PARTNERS AND FRIENDS",
    menuTitleUk: "СПОНСОРИ",
    menuTitleEn: "SPONSORS"
  },
  {
    sectionKey: "contact",
    sortOrder: 5,
    isEnabled: true,
    titleUk: "ЗВ'ЯЗАТИСЯ З НАМИ",
    titleEn: "CONTACT US",
    menuTitleUk: "КОНТАКТИ",
    menuTitleEn: "CONTACT"
  }
];

const HERO_SUBTITLE_DEFAULT = "Neurofunk • Drum & Bass • Breakbeat • Techstep";

function getSectionDefaultsMap() {
  return SECTION_SETTINGS_DEFAULTS.reduce((acc, entry) => {
    acc[entry.sectionKey] = entry;
    return acc;
  }, {});
}

function normalizeSectionSettingsForAdmin(rows) {
  const defaultsMap = getSectionDefaultsMap();
  const normalized = Array.isArray(rows)
    ? rows.map((row) => {
      const sectionKey = String(row.sectionKey || row.section_key || "").trim();
      const fallback = defaultsMap[sectionKey] || null;
      if (!sectionKey || !fallback) return null;
      return {
        sectionKey,
        sortOrder: Number.isFinite(Number(row.sortOrder ?? row.sort_order))
          ? Number(row.sortOrder ?? row.sort_order)
          : fallback.sortOrder,
        isEnabled: typeof row.isEnabled === "boolean"
          ? row.isEnabled
          : (typeof row.is_enabled === "boolean" ? row.is_enabled : fallback.isEnabled),
        titleUk: String(row.titleUk || row.title_uk || row.defaultTitle || fallback.titleUk).trim() || fallback.titleUk,
        titleEn: String(row.titleEn || row.title_en || row.defaultTitle || fallback.titleEn).trim() || fallback.titleEn,
        menuTitleUk: String(row.menuTitleUk || row.menu_title_uk || row.titleUk || row.title_uk || fallback.menuTitleUk || fallback.titleUk).trim() || fallback.menuTitleUk || fallback.titleUk,
        menuTitleEn: String(row.menuTitleEn || row.menu_title_en || row.titleEn || row.title_en || fallback.menuTitleEn || fallback.titleEn).trim() || fallback.menuTitleEn || fallback.titleEn
      };
    }).filter(Boolean)
    : [];

  const missing = SECTION_SETTINGS_DEFAULTS
    .filter((entry) => !normalized.some((item) => item.sectionKey === entry.sectionKey))
    .map((entry) => ({ ...entry }));

  return [...normalized, ...missing].sort((left, right) => {
    if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
    return left.sectionKey.localeCompare(right.sectionKey);
  });
}

function normalizeSectionSettingsForPublic(rows, requestedLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const adminRows = normalizeSectionSettingsForAdmin(rows);
  return adminRows
    .sort((left, right) => left.sortOrder - right.sortOrder)
    .map((row) => ({
      sectionKey: row.sectionKey,
      sortOrder: row.sortOrder,
      isEnabled: row.isEnabled,
      title: language === "en" ? row.titleEn : row.titleUk,
      menuTitle: language === "en" ? row.menuTitleEn : row.menuTitleUk
    }));
}

async function verifySettingsI18nLanguages(queryable, settingsId, languages = []) {
  const normalizedLanguages = Array.isArray(languages)
    ? languages.map((language) => String(language || "").trim().toLowerCase()).filter(Boolean)
    : [];

  if (!settingsId || normalizedLanguages.length === 0) {
    return;
  }

  const placeholders = normalizedLanguages.map((_, index) => `$${index + 2}`).join(", ");
  const result = await queryable.query(
    `SELECT language_code AS "languageCode"
      FROM settings_i18n
      WHERE settings_id = $1
        AND language_code IN (${placeholders})`,
    [settingsId, ...normalizedLanguages]
  );

  const present = new Set(
    (result.rows || [])
      .map((row) => String(row.languageCode || "").trim().toLowerCase())
      .filter(Boolean)
  );

  const missing = normalizedLanguages.filter((language) => !present.has(language));
  if (missing.length > 0) {
    throw new Error(`settings_i18n is missing languages after save: ${missing.join(",")}`);
  }
}

async function upsertSettingsHeroSubtitles(queryable, payload, requestedLanguage = config.defaultLanguage) {
  const settingsIdResult = await queryable.query("SELECT id FROM settings ORDER BY id ASC LIMIT 1");
  const settingsId = settingsIdResult.rows[0] && settingsIdResult.rows[0].id;
  if (!settingsId) return;

  const activeLanguage = resolveLanguage(requestedLanguage);

  const heroSubtitleUk = String(payload.heroSubtitleUk || HERO_SUBTITLE_DEFAULT).trim() || HERO_SUBTITLE_DEFAULT;
  const heroSubtitleEn = String(payload.heroSubtitleEn || HERO_SUBTITLE_DEFAULT).trim() || HERO_SUBTITLE_DEFAULT;
  const localizedFromPayload = {
    title: String(payload.title || "").trim(),
    about: String(payload.about || "").trim(),
    mission: String(payload.mission || "").trim(),
    contactCaptchaErrorMessage: String(payload.contactCaptchaErrorMessage || "").trim(),
    contactCaptchaMissingTokenMessage: String(payload.contactCaptchaMissingTokenMessage || "").trim(),
    contactCaptchaInvalidDomainMessage: String(payload.contactCaptchaInvalidDomainMessage || "").trim()
  };

  const hasExplicitLocalizedField = (key) => Object.prototype.hasOwnProperty.call(payload, key);
  const readExplicitLocalizedField = (key) => String(payload[key] ?? "").trim();

  const existingI18nResult = await queryable.query(
    `SELECT
      language_code AS "languageCode",
      title,
      about,
      mission,
      contact_captcha_error_message AS "contactCaptchaErrorMessage",
      contact_captcha_missing_token_message AS "contactCaptchaMissingTokenMessage",
      contact_captcha_invalid_domain_message AS "contactCaptchaInvalidDomainMessage"
    FROM settings_i18n
    WHERE settings_id = $1
      AND language_code IN ('uk', 'en')`,
    [settingsId]
  );

  const existingByLanguage = (existingI18nResult.rows || []).reduce((acc, row) => {
    const languageCode = String(row.languageCode || "").trim().toLowerCase();
    if (!languageCode) return acc;
    acc[languageCode] = {
      title: String(row.title || "").trim(),
      about: String(row.about || "").trim(),
      mission: String(row.mission || "").trim(),
      contactCaptchaErrorMessage: String(row.contactCaptchaErrorMessage || "").trim(),
      contactCaptchaMissingTokenMessage: String(row.contactCaptchaMissingTokenMessage || "").trim(),
      contactCaptchaInvalidDomainMessage: String(row.contactCaptchaInvalidDomainMessage || "").trim()
    };
    return acc;
  }, {});

  const resolveLocalizedField = (languageCode, fieldName) => {
    if (languageCode === activeLanguage) {
      return localizedFromPayload[fieldName];
    }

    const existing = existingByLanguage[languageCode];
    if (existing && Object.prototype.hasOwnProperty.call(existing, fieldName)) {
      return existing[fieldName];
    }

    return localizedFromPayload[fieldName];
  };

  const resolveExplicitOrLocalizedField = (languageCode, fieldName, explicitKey) => {
    if (hasExplicitLocalizedField(explicitKey)) {
      return readExplicitLocalizedField(explicitKey);
    }
    return resolveLocalizedField(languageCode, fieldName);
  };

  const localizedByLanguage = {
    uk: {
      title: resolveExplicitOrLocalizedField("uk", "title", "titleUk"),
      about: resolveExplicitOrLocalizedField("uk", "about", "aboutUk"),
      mission: resolveExplicitOrLocalizedField("uk", "mission", "missionUk"),
      contactCaptchaErrorMessage: resolveLocalizedField("uk", "contactCaptchaErrorMessage"),
      contactCaptchaMissingTokenMessage: resolveLocalizedField("uk", "contactCaptchaMissingTokenMessage"),
      contactCaptchaInvalidDomainMessage: resolveLocalizedField("uk", "contactCaptchaInvalidDomainMessage"),
      heroSubtitle: heroSubtitleUk
    },
    en: {
      title: resolveExplicitOrLocalizedField("en", "title", "titleEn"),
      about: resolveExplicitOrLocalizedField("en", "about", "aboutEn"),
      mission: resolveExplicitOrLocalizedField("en", "mission", "missionEn"),
      contactCaptchaErrorMessage: resolveLocalizedField("en", "contactCaptchaErrorMessage"),
      contactCaptchaMissingTokenMessage: resolveLocalizedField("en", "contactCaptchaMissingTokenMessage"),
      contactCaptchaInvalidDomainMessage: resolveLocalizedField("en", "contactCaptchaInvalidDomainMessage"),
      heroSubtitle: heroSubtitleEn
    }
  };

  const upsertByLanguage = async (languageCode, heroSubtitle, includeHeroSubtitle = true) => {
    const localized = localizedByLanguage[languageCode] || localizedByLanguage.uk;

    if (includeHeroSubtitle) {
      await queryable.query(
        `INSERT INTO settings_i18n (
          settings_id,
          language_code,
          title,
          about,
          mission,
          contact_captcha_error_message,
          contact_captcha_missing_token_message,
          contact_captcha_invalid_domain_message,
          hero_subtitle
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (settings_id, language_code)
        DO UPDATE SET
          title = EXCLUDED.title,
          about = EXCLUDED.about,
          mission = EXCLUDED.mission,
          contact_captcha_error_message = EXCLUDED.contact_captcha_error_message,
          contact_captcha_missing_token_message = EXCLUDED.contact_captcha_missing_token_message,
          contact_captcha_invalid_domain_message = EXCLUDED.contact_captcha_invalid_domain_message,
          hero_subtitle = EXCLUDED.hero_subtitle,
          updated_at = NOW()`,
        [
          settingsId,
          languageCode,
          localized.title,
          localized.about,
          localized.mission,
          localized.contactCaptchaErrorMessage,
          localized.contactCaptchaMissingTokenMessage,
          localized.contactCaptchaInvalidDomainMessage,
          heroSubtitle
        ]
      );
      return;
    }

    await queryable.query(
      `INSERT INTO settings_i18n (
        settings_id,
        language_code,
        title,
        about,
        mission,
        contact_captcha_error_message,
        contact_captcha_missing_token_message,
        contact_captcha_invalid_domain_message
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (settings_id, language_code)
      DO UPDATE SET
        title = EXCLUDED.title,
        about = EXCLUDED.about,
        mission = EXCLUDED.mission,
        contact_captcha_error_message = EXCLUDED.contact_captcha_error_message,
        contact_captcha_missing_token_message = EXCLUDED.contact_captcha_missing_token_message,
        contact_captcha_invalid_domain_message = EXCLUDED.contact_captcha_invalid_domain_message,
        updated_at = NOW()`,
      [
        settingsId,
        languageCode,
        localized.title,
        localized.about,
        localized.mission,
        localized.contactCaptchaErrorMessage,
        localized.contactCaptchaMissingTokenMessage,
        localized.contactCaptchaInvalidDomainMessage
      ]
    );
  };

  try {
    await upsertByLanguage("uk", heroSubtitleUk, true);
    await upsertByLanguage("en", heroSubtitleEn, true);
  } catch (error) {
    if (error && error.code === "42703") {
      // hero_subtitle column is unavailable before migration.
      await upsertByLanguage("uk", heroSubtitleUk, false);
      await upsertByLanguage("en", heroSubtitleEn, false);
    } else {
      throw error;
    }
  }

  await verifySettingsI18nLanguages(queryable, settingsId, ["uk", "en"]);
}

async function getSettingsHeroSubtitles(queryable) {
  try {
    const result = await queryable.query(
      `SELECT language_code, hero_subtitle
      FROM settings_i18n
      WHERE settings_id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
        AND language_code IN ('uk', 'en')`
    );

    const byLanguage = (result.rows || []).reduce((acc, row) => {
      const languageCode = String(row.language_code || "").trim().toLowerCase();
      if (!languageCode) return acc;
      acc[languageCode] = String(row.hero_subtitle || "").trim();
      return acc;
    }, {});

    return {
      heroSubtitleUk: byLanguage.uk || HERO_SUBTITLE_DEFAULT,
      heroSubtitleEn: byLanguage.en || HERO_SUBTITLE_DEFAULT
    };
  } catch (error) {
    if (error && error.code === "42703") {
      return {
        heroSubtitleUk: HERO_SUBTITLE_DEFAULT,
        heroSubtitleEn: HERO_SUBTITLE_DEFAULT
      };
    }
    throw error;
  }
}

async function getPublicHeroSubtitle(queryable, language, defaultLanguage) {
  try {
    const result = await queryable.query(
      `SELECT
        COALESCE(i18n_lang.hero_subtitle, i18n_default.hero_subtitle, $3) AS "heroSubtitle"
      FROM settings AS s
      LEFT JOIN settings_i18n AS i18n_lang
        ON i18n_lang.settings_id = s.id
       AND i18n_lang.language_code = $1
      LEFT JOIN settings_i18n AS i18n_default
        ON i18n_default.settings_id = s.id
       AND i18n_default.language_code = $2
      ORDER BY s.id ASC
      LIMIT 1`,
      [language, defaultLanguage, HERO_SUBTITLE_DEFAULT]
    );
    const row = result.rows[0] || null;
    return String(row && row.heroSubtitle ? row.heroSubtitle : "").trim() || HERO_SUBTITLE_DEFAULT;
  } catch (error) {
    if (error && error.code === "42703") return HERO_SUBTITLE_DEFAULT;
    throw error;
  }
}

const DEFAULT_AUDIT_LATENCY_SETTINGS = {
  auditLatencyGoodMaxMs: 300,
  auditLatencyWarnMaxMs: 800
};

function isMissingAuditLatencyColumnsError(error) {
  const message = String(error?.message || "").toLowerCase();
  return error?.code === "42703" && message.includes("audit_latency_");
}

function withDefaultAuditLatencySettings(row) {
  if (!row) return null;
  const nextGood = Number.isFinite(Number(row.auditLatencyGoodMaxMs))
    ? Number(row.auditLatencyGoodMaxMs)
    : DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyGoodMaxMs;
  const nextWarn = Number.isFinite(Number(row.auditLatencyWarnMaxMs))
    ? Number(row.auditLatencyWarnMaxMs)
    : DEFAULT_AUDIT_LATENCY_SETTINGS.auditLatencyWarnMaxMs;

  return {
    ...row,
    auditLatencyGoodMaxMs: nextGood,
    auditLatencyWarnMaxMs: nextWarn
  };
}

async function upsertAdminSettings(queryable, payload, requestedLanguage = config.defaultLanguage) {
  const existing = await queryAdminSettings(queryable);
  if (!existing) {
    try {
      await queryable.query(
      `INSERT INTO settings (
        title,
        about,
        mission,
        email,
        instagram_url,
        youtube_url,
        soundcloud_url,
        radio_url,
        header_logo_url,
        footer_logo_url,
        hero_main_logo_data_url,
        contact_captcha_enabled,
        contact_captcha_active_provider,
        contact_captcha_hcaptcha_site_key,
        contact_captcha_hcaptcha_secret_key,
        contact_captcha_recaptcha_site_key,
        contact_captcha_recaptcha_secret_key,
        contact_captcha_error_message,
        contact_captcha_missing_token_message,
        contact_captcha_invalid_domain_message,
        contact_captcha_allowed_domain,
        audit_latency_good_max_ms,
        audit_latency_warn_max_ms
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19, $20, $21,
        $22, $23
      ) RETURNING *`,
      [
        payload.title,
        payload.about,
        payload.mission,
        payload.email,
        payload.instagramUrl,
        payload.youtubeUrl,
        payload.soundcloudUrl,
        payload.radioUrl,
        payload.headerLogoUrl,
        payload.footerLogoUrl,
        payload.heroMainLogoDataUrl,
        payload.contactCaptchaEnabled,
        payload.contactCaptchaActiveProvider,
        payload.contactCaptchaHcaptchaSiteKey,
        payload.contactCaptchaHcaptchaSecretKey,
        payload.contactCaptchaRecaptchaSiteKey,
        payload.contactCaptchaRecaptchaSecretKey,
        payload.contactCaptchaErrorMessage,
        payload.contactCaptchaMissingTokenMessage,
        payload.contactCaptchaInvalidDomainMessage,
        payload.contactCaptchaAllowedDomain,
        payload.auditLatencyGoodMaxMs,
        payload.auditLatencyWarnMaxMs
      ]
      );
    } catch (error) {
      if (!isMissingAuditLatencyColumnsError(error)) throw error;
      await queryable.query(
        `INSERT INTO settings (
          title,
          about,
          mission,
          email,
          instagram_url,
          youtube_url,
          soundcloud_url,
          radio_url,
          header_logo_url,
          footer_logo_url,
          hero_main_logo_data_url,
          contact_captcha_enabled,
          contact_captcha_active_provider,
          contact_captcha_hcaptcha_site_key,
          contact_captcha_hcaptcha_secret_key,
          contact_captcha_recaptcha_site_key,
          contact_captcha_recaptcha_secret_key,
          contact_captcha_error_message,
          contact_captcha_missing_token_message,
          contact_captcha_invalid_domain_message,
          contact_captcha_allowed_domain
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          $9, $10, $11,
          $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
        ) RETURNING *`,
        [
          payload.title,
          payload.about,
          payload.mission,
          payload.email,
          payload.instagramUrl,
          payload.youtubeUrl,
          payload.soundcloudUrl,
          payload.radioUrl,
          payload.headerLogoUrl,
          payload.footerLogoUrl,
          payload.heroMainLogoDataUrl,
          payload.contactCaptchaEnabled,
          payload.contactCaptchaActiveProvider,
          payload.contactCaptchaHcaptchaSiteKey,
          payload.contactCaptchaHcaptchaSecretKey,
          payload.contactCaptchaRecaptchaSiteKey,
          payload.contactCaptchaRecaptchaSecretKey,
          payload.contactCaptchaErrorMessage,
          payload.contactCaptchaMissingTokenMessage,
          payload.contactCaptchaInvalidDomainMessage,
          payload.contactCaptchaAllowedDomain
        ]
      );
    }
    await upsertSettingsHeroSubtitles(queryable, payload, requestedLanguage);
    return;
  }

  try {
    await queryable.query(
      `UPDATE settings SET
      title = $1,
      about = $2,
      mission = $3,
      email = $4,
      instagram_url = $5,
      youtube_url = $6,
      soundcloud_url = $7,
      radio_url = $8,
      header_logo_url = $9,
      footer_logo_url = $10,
      hero_main_logo_data_url = $11,
      contact_captcha_enabled = $12,
      contact_captcha_active_provider = $13,
      contact_captcha_hcaptcha_site_key = $14,
      contact_captcha_hcaptcha_secret_key = $15,
      contact_captcha_recaptcha_site_key = $16,
      contact_captcha_recaptcha_secret_key = $17,
      contact_captcha_error_message = $18,
      contact_captcha_missing_token_message = $19,
      contact_captcha_invalid_domain_message = $20,
      contact_captcha_allowed_domain = $21,
      audit_latency_good_max_ms = $22,
      audit_latency_warn_max_ms = $23,
      updated_at = NOW()
    WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
    RETURNING id`,
    [
      payload.title,
      payload.about,
      payload.mission,
      payload.email,
      payload.instagramUrl,
      payload.youtubeUrl,
      payload.soundcloudUrl,
      payload.radioUrl,
      payload.headerLogoUrl,
      payload.footerLogoUrl,
      payload.heroMainLogoDataUrl,
      payload.contactCaptchaEnabled,
      payload.contactCaptchaActiveProvider,
      payload.contactCaptchaHcaptchaSiteKey,
      payload.contactCaptchaHcaptchaSecretKey,
      payload.contactCaptchaRecaptchaSiteKey,
      payload.contactCaptchaRecaptchaSecretKey,
      payload.contactCaptchaErrorMessage,
      payload.contactCaptchaMissingTokenMessage,
      payload.contactCaptchaInvalidDomainMessage,
      payload.contactCaptchaAllowedDomain,
      payload.auditLatencyGoodMaxMs,
      payload.auditLatencyWarnMaxMs
    ]
    );
  } catch (error) {
    if (!isMissingAuditLatencyColumnsError(error)) throw error;
    await queryable.query(
      `UPDATE settings SET
        title = $1,
        about = $2,
        mission = $3,
        email = $4,
        instagram_url = $5,
        youtube_url = $6,
        soundcloud_url = $7,
        radio_url = $8,
        header_logo_url = $9,
        footer_logo_url = $10,
        hero_main_logo_data_url = $11,
        contact_captcha_enabled = $12,
        contact_captcha_active_provider = $13,
        contact_captcha_hcaptcha_site_key = $14,
        contact_captcha_hcaptcha_secret_key = $15,
        contact_captcha_recaptcha_site_key = $16,
        contact_captcha_recaptcha_secret_key = $17,
        contact_captcha_error_message = $18,
        contact_captcha_missing_token_message = $19,
        contact_captcha_invalid_domain_message = $20,
        contact_captcha_allowed_domain = $21,
        updated_at = NOW()
      WHERE id = (SELECT id FROM settings ORDER BY id ASC LIMIT 1)
      RETURNING id`,
      [
        payload.title,
        payload.about,
        payload.mission,
        payload.email,
        payload.instagramUrl,
        payload.youtubeUrl,
        payload.soundcloudUrl,
        payload.radioUrl,
        payload.headerLogoUrl,
        payload.footerLogoUrl,
        payload.heroMainLogoDataUrl,
        payload.contactCaptchaEnabled,
        payload.contactCaptchaActiveProvider,
        payload.contactCaptchaHcaptchaSiteKey,
        payload.contactCaptchaHcaptchaSecretKey,
        payload.contactCaptchaRecaptchaSiteKey,
        payload.contactCaptchaRecaptchaSecretKey,
        payload.contactCaptchaErrorMessage,
        payload.contactCaptchaMissingTokenMessage,
        payload.contactCaptchaInvalidDomainMessage,
        payload.contactCaptchaAllowedDomain
      ]
    );
  }

  await upsertSettingsHeroSubtitles(queryable, payload, requestedLanguage);
}

async function upsertSectionSettings(queryable, sectionsPayload) {
  const normalizedSections = normalizeSectionSettingsForAdmin(sectionsPayload);
  const defaultsMap = getSectionDefaultsMap();

  for (const section of normalizedSections) {
    const fallback = defaultsMap[section.sectionKey] || section;

    const upsertResult = await queryable.query(
      `INSERT INTO section_settings (section_key, sort_order, is_enabled, default_title)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (section_key)
       DO UPDATE SET
         sort_order = EXCLUDED.sort_order,
         is_enabled = EXCLUDED.is_enabled,
         default_title = EXCLUDED.default_title,
         updated_at = NOW()
       RETURNING id`,
      [
        section.sectionKey,
        section.sortOrder,
        section.isEnabled,
        section.titleUk || fallback.titleUk
      ]
    );

    const sectionId = upsertResult.rows[0] && upsertResult.rows[0].id;
    if (!sectionId) continue;

    await queryable.query(
      `INSERT INTO section_settings_i18n (section_settings_id, language_code, title, nav_title)
       VALUES ($1, 'uk', $2, $3)
       ON CONFLICT (section_settings_id, language_code)
       DO UPDATE SET title = EXCLUDED.title, nav_title = EXCLUDED.nav_title, updated_at = NOW()`,
      [
        sectionId,
        section.titleUk || fallback.titleUk,
        section.menuTitleUk || section.titleUk || fallback.menuTitleUk || fallback.titleUk
      ]
    );

    await queryable.query(
      `INSERT INTO section_settings_i18n (section_settings_id, language_code, title, nav_title)
       VALUES ($1, 'en', $2, $3)
       ON CONFLICT (section_settings_id, language_code)
       DO UPDATE SET title = EXCLUDED.title, nav_title = EXCLUDED.nav_title, updated_at = NOW()`,
      [
        sectionId,
        section.titleEn || fallback.titleEn,
        section.menuTitleEn || section.titleEn || fallback.menuTitleEn || fallback.titleEn
      ]
    );
  }
}

const tableConfig = {
  releases: {
    table: "releases",
    columns: ["title", "artist", "genre", "release_type", "release_date", "year", "image", "link", "ticket_link"]
  },
  artists: {
    table: "artists",
    columns: ["name", "genre", "bio", "image", "soundcloud", "instagram"]
  },
  events: {
    table: "events",
    columns: ["title", "date", "time", "venue", "description", "image", "ticket_link"]
  },
  sponsors: {
    table: "sponsors",
    columns: ["name", "short_description", "logo", "link", "sort_order"]
  }
};

const i18nReadConfig = {
  releases: {
    table: "releases",
    i18nTable: "releases_i18n",
    i18nEntityId: "release_id",
    translatedFields: ["title", "artist", "genre"]
  },
  artists: {
    table: "artists",
    i18nTable: "artists_i18n",
    i18nEntityId: "artist_id",
    translatedFields: ["name", "genre", "bio"]
  },
  events: {
    table: "events",
    i18nTable: "events_i18n",
    i18nEntityId: "event_id",
    translatedFields: ["title", "venue", "description"]
  },
  sponsors: {
    table: "sponsors",
    i18nTable: "sponsors_i18n",
    i18nEntityId: "sponsor_id",
    translatedFields: ["name", "short_description"]
  }
};

function toCamelCase(value) {
  return String(value).replace(/_([a-z])/g, (_, char) => char.toUpperCase());
}

function getTranslationValue(translation, dbField, fallbackRow) {
  const camelField = toCamelCase(dbField);
  const rawValue = translation?.[camelField] ?? translation?.[dbField];
  if (rawValue === undefined || rawValue === null || rawValue === "") {
    return String(fallbackRow?.[dbField] ?? "");
  }
  return String(rawValue);
}

async function upsertEntityTranslations(type, entityId, payload, fallbackRow) {
  const i18nConfig = i18nReadConfig[type];
  if (!i18nConfig) return;

  const i18nPayload = payload?.i18n;
  if (!i18nPayload || typeof i18nPayload !== "object") return;

  const entries = Object.entries(i18nPayload);
  if (entries.length === 0) return;

  for (const [rawLanguage, translation] of entries) {
    if (!translation || typeof translation !== "object") continue;

    const normalizedLanguage = String(rawLanguage || "").trim().toLowerCase();
    if (!config.supportedLanguages.includes(normalizedLanguage)) continue;

    const fields = i18nConfig.translatedFields;
    const values = fields.map((field) => getTranslationValue(translation, field, fallbackRow));

    const columns = [i18nConfig.i18nEntityId, "language_code", ...fields];
    const placeholders = columns.map((_, index) => `$${index + 1}`).join(", ");
    const updates = fields.map((field) => `${field} = EXCLUDED.${field}`).join(", ");

    await pool.query(
      `INSERT INTO ${i18nConfig.i18nTable} (${columns.join(", ")})
       VALUES (${placeholders})
       ON CONFLICT (${i18nConfig.i18nEntityId}, language_code)
       DO UPDATE SET ${updates}, updated_at = NOW()`,
      [entityId, normalizedLanguage, ...values]
    );
  }
}

function normalizeIsoDate(value) {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    return formatDateToLocalIso(value, "");
  }

  const rawValue = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(rawValue)) {
    return rawValue;
  }

  const localIso = formatDateToLocalIso(rawValue, "");
  if (localIso) return localIso;

  const match = rawValue.match(/^(\d{4}-\d{2}-\d{2})(?:[T\s].*)?$/);
  return match ? match[1] : "";
}

function formatDateToLocalIso(value, fallback = "") {
  const date = value instanceof Date ? value : new Date(value);
  const timestamp = date.getTime();
  if (!Number.isFinite(timestamp)) return fallback;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function deriveYearFromDateOrFallback(releaseDate, fallbackYear = "") {
  const isoDate = normalizeIsoDate(releaseDate);
  if (isoDate) return isoDate.slice(0, 4);

  const rawYear = String(fallbackYear || "").trim();
  if (/^\d{4}$/.test(rawYear)) return rawYear;

  return String(new Date().getFullYear());
}

function normalizeReleasePayload(payload) {
  const rawPayload = payload && typeof payload === "object" ? payload : {};
  const releaseDate = normalizeIsoDate(rawPayload.releaseDate || rawPayload.release_date) || `${deriveYearFromDateOrFallback("", rawPayload.year)}-01-01`;
  const year = deriveYearFromDateOrFallback(releaseDate, rawPayload.year);

  return {
    ...rawPayload,
    releaseDate,
    year,
    releaseType: rawPayload.releaseType || rawPayload.release_type || "single"
  };
}

function fromDbRow(type, row) {
  if (type === "releases") {
    const releaseDate = normalizeIsoDate(row.release_date) || `${deriveYearFromDateOrFallback("", row.year)}-01-01`;
    return {
      ...row,
      ticketLink: row.ticket_link,
      releaseType: row.release_type || "single",
      releaseDate
    };
  }
  if (type === "events") {
    return { ...row, ticketLink: row.ticket_link };
  }
  if (type === "sponsors") {
    return {
      ...row,
      shortDescription: row.short_description || "",
      sortOrder: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : 0
    };
  }
  return row;
}

function toDbValue(key, value) {
  if (key === "ticketLink") return ["ticket_link", value || ""];
  if (key === "releaseType") return ["release_type", value || "single"];
  if (key === "releaseDate") return ["release_date", normalizeIsoDate(value)];
  if (key === "shortDescription") return ["short_description", value || ""];
  if (key === "sortOrder") return ["sort_order", Number.isFinite(Number(value)) ? Number(value) : 0];
  return [key, value];
}

function payloadKeyFromDbColumn(column) {
  if (column === "ticket_link") return "ticketLink";
  if (column === "release_type") return "releaseType";
  if (column === "release_date") return "releaseDate";
  if (column === "short_description") return "shortDescription";
  if (column === "sort_order") return "sortOrder";
  return column;
}

const tableColumnsCache = new Map();

async function getTableColumns(tableName, forceRefresh = false) {
  const normalizedTableName = String(tableName || "").trim();
  if (!normalizedTableName) return null;

  if (!forceRefresh && tableColumnsCache.has(normalizedTableName)) {
    return tableColumnsCache.get(normalizedTableName);
  }

  try {
    const result = await pool.query(
      `SELECT column_name
      FROM information_schema.columns
      WHERE table_schema = current_schema()
        AND table_name = $1`,
      [normalizedTableName]
    );

    const columns = new Set(
      (result.rows || [])
        .map((row) => String(row.column_name || "").trim())
        .filter(Boolean)
    );

    tableColumnsCache.set(normalizedTableName, columns);
    return columns;
  } catch (_error) {
    return null;
  }
}

function isMissingColumnError(error) {
  return String(error && error.code ? error.code : "").trim() === "42703";
}

async function resolveWritableColumns(type, entityConfig, forceRefresh = false) {
  if (type !== "releases") {
    return entityConfig.columns;
  }

  const schemaColumns = await getTableColumns(entityConfig.table, forceRefresh);
  if (!schemaColumns || schemaColumns.size === 0) {
    return entityConfig.columns;
  }

  const writableColumns = entityConfig.columns.filter((column) => schemaColumns.has(column));
  return writableColumns.length > 0 ? writableColumns : entityConfig.columns;
}

function toBoundedInteger(value, fallback, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  const normalized = Math.round(numeric);
  if (normalized < min) return min;
  if (normalized > max) return max;
  return normalized;
}

function fromDbReleaseTrackRow(row) {
  return {
    id: row.id,
    releaseId: row.release_id,
    title: row.title,
    audioDataUrl: row.audio_data_url,
    durationSeconds: toBoundedInteger(row.duration_seconds, 0, 0, 86400),
    sortOrder: toBoundedInteger(row.sort_order, 0, 0, 9999)
  };
}

export async function listByType(type, requestedLanguage = config.defaultLanguage) {
  const entityConfig = tableConfig[type];
  const i18nConfig = i18nReadConfig[type];
  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  const orderClause = type === "sponsors" ? "ORDER BY sort_order ASC, id ASC" : "ORDER BY id ASC";

  if (!i18nConfig) {
    const result = await pool.query(`SELECT * FROM ${entityConfig.table} ${orderClause}`);
    return result.rows.map((row) => fromDbRow(type, row));
  }

  const translatedSelect = i18nConfig.translatedFields
    .map((field) => `COALESCE(i18n_lang.${field}, i18n_default.${field}, base.${field}) AS ${field}`)
    .join(",\n      ");

  const result = await pool.query(
    `SELECT
      base.*,
      ${translatedSelect}
    FROM ${i18nConfig.table} AS base
    LEFT JOIN ${i18nConfig.i18nTable} AS i18n_lang
      ON i18n_lang.${i18nConfig.i18nEntityId} = base.id
      AND i18n_lang.language_code = $1
    LEFT JOIN ${i18nConfig.i18nTable} AS i18n_default
      ON i18n_default.${i18nConfig.i18nEntityId} = base.id
      AND i18n_default.language_code = $2
    ${orderClause}`,
    [language, defaultLanguage]
  );

  return result.rows.map((row) => fromDbRow(type, row));
}

export async function createByType(type, payload) {
  const entityConfig = tableConfig[type];
  const normalizedPayload = type === "releases" ? normalizeReleasePayload(payload) : payload;

  const createWithColumns = async (columns) => {
    const mapped = columns.map((column) => {
      const payloadKey = payloadKeyFromDbColumn(column);
      return normalizedPayload[payloadKey] ?? "";
    });

    const placeholders = mapped.map((_, index) => `$${index + 1}`).join(", ");
    const query = `INSERT INTO ${entityConfig.table} (${columns.join(", ")}) VALUES (${placeholders}) RETURNING *`;
    const result = await pool.query(query, mapped);
    return result.rows[0] || null;
  };

  let baseRow = null;
  const writableColumns = await resolveWritableColumns(type, entityConfig);
  try {
    baseRow = await createWithColumns(writableColumns);
  } catch (error) {
    if (type !== "releases" || !isMissingColumnError(error)) {
      throw error;
    }

    const refreshedColumns = await resolveWritableColumns(type, entityConfig, true);
    baseRow = await createWithColumns(refreshedColumns);
  }

  if (!baseRow) return null;
  await upsertEntityTranslations(type, baseRow.id, normalizedPayload, baseRow);
  return fromDbRow(type, baseRow);
}

export async function updateByType(type, id, payload) {
  const entityConfig = tableConfig[type];
  const normalizedPayload = type === "releases" ? normalizeReleasePayload(payload) : payload;

  const updateWithColumns = async (columns) => {
    const writableColumns = new Set(columns);
    const assignments = [];
    const values = [];

    Object.entries(normalizedPayload).forEach(([key, value]) => {
      if (key === "id" || key === "i18n") return;
      const [dbKey, dbValue] = toDbValue(key, value);
      if (!writableColumns.has(dbKey)) return;
      values.push(dbValue);
      assignments.push(`${dbKey} = $${values.length}`);
    });

    if (assignments.length > 0) {
      values.push(id);
      const result = await pool.query(
        `UPDATE ${entityConfig.table} SET ${assignments.join(", ")} WHERE id = $${values.length} RETURNING *`,
        values
      );
      return result.rows[0] || null;
    }

    const existing = await pool.query(`SELECT * FROM ${entityConfig.table} WHERE id = $1`, [id]);
    return existing.rows[0] || null;
  };

  let row = null;
  const writableColumns = await resolveWritableColumns(type, entityConfig);
  try {
    row = await updateWithColumns(writableColumns);
  } catch (error) {
    if (type !== "releases" || !isMissingColumnError(error)) {
      throw error;
    }

    const refreshedColumns = await resolveWritableColumns(type, entityConfig, true);
    row = await updateWithColumns(refreshedColumns);
  }

  if (!row) return null;

  await upsertEntityTranslations(type, id, normalizedPayload, row);
  return fromDbRow(type, row);
}

export async function deleteByType(type, id) {
  const config = tableConfig[type];
  await pool.query(`DELETE FROM ${config.table} WHERE id = $1`, [id]);
}

export async function getReleaseById(releaseId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return null;
  const result = await pool.query("SELECT id FROM releases WHERE id = $1", [normalizedReleaseId]);
  return result.rows[0] || null;
}

export async function listReleaseTracksByReleaseId(releaseId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return [];

  const result = await pool.query(
    `SELECT
      id,
      release_id,
      title,
      audio_data_url,
      duration_seconds,
      sort_order
    FROM release_tracks
    WHERE release_id = $1
    ORDER BY sort_order ASC, id ASC`,
    [normalizedReleaseId]
  );

  return (result.rows || []).map((row) => fromDbReleaseTrackRow(row));
}

export async function listReleaseTrackMetaByReleaseId(releaseId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return [];

  const result = await pool.query(
    `SELECT
      id,
      release_id,
      title,
      duration_seconds,
      sort_order
    FROM release_tracks
    WHERE release_id = $1
    ORDER BY sort_order ASC, id ASC`,
    [normalizedReleaseId]
  );

  return (result.rows || []).map((row) => ({
    id: row.id,
    releaseId: row.release_id,
    title: row.title,
    durationSeconds: toBoundedInteger(row.duration_seconds, 0, 0, 86400),
    sortOrder: toBoundedInteger(row.sort_order, 0, 0, 9999)
  }));
}

export async function getReleaseTrackById(releaseId, trackId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  const normalizedTrackId = toBoundedInteger(trackId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId || !normalizedTrackId) return null;

  const result = await pool.query(
    `SELECT
      id,
      release_id,
      title,
      audio_data_url,
      duration_seconds,
      sort_order,
      updated_at
    FROM release_tracks
    WHERE release_id = $1
      AND id = $2
    LIMIT 1`,
    [normalizedReleaseId, normalizedTrackId]
  );

  if (!result.rows[0]) return null;

  const normalizedTrack = fromDbReleaseTrackRow(result.rows[0]);
  return {
    ...normalizedTrack,
    updatedAt: result.rows[0].updated_at ? new Date(result.rows[0].updated_at).toISOString() : ""
  };
}

export async function replaceReleaseTracksByReleaseId(releaseId, tracksPayload = []) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return [];

  const tracks = Array.isArray(tracksPayload) ? tracksPayload : [];
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("DELETE FROM release_tracks WHERE release_id = $1", [normalizedReleaseId]);

    const createdRows = [];
    for (let index = 0; index < tracks.length; index += 1) {
      const track = tracks[index] && typeof tracks[index] === "object" ? tracks[index] : {};
      const title = String(track.title || "").trim();
      const audioDataUrl = String(track.audioDataUrl || track.audio_data_url || "").trim();
      const durationSeconds = toBoundedInteger(track.durationSeconds ?? track.duration_seconds, 0, 0, 86400);
      const sortOrder = toBoundedInteger(track.sortOrder ?? track.sort_order, index + 1, 0, 9999);

      const insertResult = await client.query(
        `INSERT INTO release_tracks (
          release_id,
          title,
          audio_data_url,
          duration_seconds,
          sort_order
        )
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, release_id, title, audio_data_url, duration_seconds, sort_order`,
        [normalizedReleaseId, title, audioDataUrl, durationSeconds, sortOrder]
      );

      if (insertResult.rows[0]) {
        createdRows.push(fromDbReleaseTrackRow(insertResult.rows[0]));
      }
    }

    await client.query("COMMIT");
    return createdRows.sort((left, right) => {
      if (left.sortOrder !== right.sortOrder) return left.sortOrder - right.sortOrder;
      return left.id - right.id;
    });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function createReleaseTrackByReleaseId(releaseId, trackPayload = {}) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId) return null;

  const payload = trackPayload && typeof trackPayload === "object" ? trackPayload : {};
  const title = String(payload.title || "").trim();
  const audioDataUrl = String(payload.audioDataUrl || payload.audio_data_url || "").trim();
  const durationSeconds = toBoundedInteger(payload.durationSeconds ?? payload.duration_seconds, 0, 0, 86400);
  const sortOrder = toBoundedInteger(payload.sortOrder ?? payload.sort_order, 0, 0, 9999);

  const result = await pool.query(
    `INSERT INTO release_tracks (
      release_id,
      title,
      audio_data_url,
      duration_seconds,
      sort_order
    )
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id, release_id, title, audio_data_url, duration_seconds, sort_order`,
    [normalizedReleaseId, title, audioDataUrl, durationSeconds, sortOrder]
  );

  return result.rows[0] ? fromDbReleaseTrackRow(result.rows[0]) : null;
}

export async function updateReleaseTrackById(releaseId, trackId, trackPayload = {}) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  const normalizedTrackId = toBoundedInteger(trackId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId || !normalizedTrackId) return null;

  const payload = trackPayload && typeof trackPayload === "object" ? trackPayload : {};
  const title = String(payload.title || "").trim();
  const hasAudioDataUrl = Object.prototype.hasOwnProperty.call(payload, "audioDataUrl")
    || Object.prototype.hasOwnProperty.call(payload, "audio_data_url");
  const audioDataUrl = hasAudioDataUrl ? String(payload.audioDataUrl || payload.audio_data_url || "").trim() : null;
  const durationSeconds = toBoundedInteger(payload.durationSeconds ?? payload.duration_seconds, 0, 0, 86400);
  const sortOrder = toBoundedInteger(payload.sortOrder ?? payload.sort_order, 0, 0, 9999);

  const assignments = [
    "title = $1",
    "duration_seconds = $2",
    "sort_order = $3",
    "updated_at = NOW()"
  ];
  const values = [title, durationSeconds, sortOrder];

  if (hasAudioDataUrl) {
    values.push(audioDataUrl);
    assignments.push(`audio_data_url = $${values.length}`);
  }

  values.push(normalizedTrackId);
  values.push(normalizedReleaseId);
  const idPlaceholder = `$${values.length - 1}`;
  const releaseIdPlaceholder = `$${values.length}`;

  const result = await pool.query(
    `UPDATE release_tracks
    SET
      ${assignments.join(",\n      ")}
    WHERE id = ${idPlaceholder}
      AND release_id = ${releaseIdPlaceholder}
    RETURNING id, release_id, title, audio_data_url, duration_seconds, sort_order`,
    values
  );

  return result.rows[0] ? fromDbReleaseTrackRow(result.rows[0]) : null;
}

export async function deleteReleaseTrackById(releaseId, trackId) {
  const normalizedReleaseId = toBoundedInteger(releaseId, 0, 1, Number.MAX_SAFE_INTEGER);
  const normalizedTrackId = toBoundedInteger(trackId, 0, 1, Number.MAX_SAFE_INTEGER);
  if (!normalizedReleaseId || !normalizedTrackId) return false;

  const result = await pool.query(
    `DELETE FROM release_tracks
    WHERE id = $1
      AND release_id = $2
    RETURNING id`,
    [normalizedTrackId, normalizedReleaseId]
  );

  return !!(result.rows[0] && result.rows[0].id);
}

const PUBLIC_SETTINGS_SELECT = `
  SELECT
    COALESCE(s_i18n_lang.title, s_i18n_default.title, s.title) AS title,
    COALESCE(s_i18n_lang.about, s_i18n_default.about, s.about) AS about,
    COALESCE(s_i18n_lang.mission, s_i18n_default.mission, s.mission) AS mission,
    email,
    header_logo_url AS "headerLogoUrl",
    footer_logo_url AS "footerLogoUrl",
    hero_main_logo_data_url AS "heroMainLogoDataUrl",
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    COALESCE(s_i18n_lang.contact_captcha_error_message, s_i18n_default.contact_captcha_error_message, s.contact_captcha_error_message) AS "contactCaptchaErrorMessage",
    COALESCE(s_i18n_lang.contact_captcha_missing_token_message, s_i18n_default.contact_captcha_missing_token_message, s.contact_captcha_missing_token_message) AS "contactCaptchaMissingTokenMessage",
    COALESCE(s_i18n_lang.contact_captcha_invalid_domain_message, s_i18n_default.contact_captcha_invalid_domain_message, s.contact_captcha_invalid_domain_message) AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain"
  FROM settings AS s
  LEFT JOIN settings_i18n AS s_i18n_lang
    ON s_i18n_lang.settings_id = s.id
    AND s_i18n_lang.language_code = $1
  LEFT JOIN settings_i18n AS s_i18n_default
    ON s_i18n_default.settings_id = s.id
    AND s_i18n_default.language_code = $2
  ORDER BY s.id ASC
  LIMIT 1
`;

const ADMIN_SETTINGS_SELECT_LOCALIZED = `
  SELECT
    COALESCE(s_i18n_lang.title, s_i18n_default.title, s.title) AS title,
    COALESCE(s_i18n_lang.about, s_i18n_default.about, s.about) AS about,
    COALESCE(s_i18n_lang.mission, s_i18n_default.mission, s.mission) AS mission,
    COALESCE(s_i18n_uk.title, s.title) AS "titleUk",
    COALESCE(s_i18n_en.title, s_i18n_uk.title, s.title) AS "titleEn",
    COALESCE(s_i18n_uk.about, s.about) AS "aboutUk",
    COALESCE(s_i18n_en.about, s_i18n_uk.about, s.about) AS "aboutEn",
    COALESCE(s_i18n_uk.mission, s.mission) AS "missionUk",
    COALESCE(s_i18n_en.mission, s_i18n_uk.mission, s.mission) AS "missionEn",
    email,
    header_logo_url AS "headerLogoUrl",
    footer_logo_url AS "footerLogoUrl",
    hero_main_logo_data_url AS "heroMainLogoDataUrl",
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_hcaptcha_secret_key AS "contactCaptchaHcaptchaSecretKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    contact_captcha_recaptcha_secret_key AS "contactCaptchaRecaptchaSecretKey",
    COALESCE(s_i18n_lang.contact_captcha_error_message, s_i18n_default.contact_captcha_error_message, s.contact_captcha_error_message) AS "contactCaptchaErrorMessage",
    COALESCE(s_i18n_lang.contact_captcha_missing_token_message, s_i18n_default.contact_captcha_missing_token_message, s.contact_captcha_missing_token_message) AS "contactCaptchaMissingTokenMessage",
    COALESCE(s_i18n_lang.contact_captcha_invalid_domain_message, s_i18n_default.contact_captcha_invalid_domain_message, s.contact_captcha_invalid_domain_message) AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain",
    audit_latency_good_max_ms AS "auditLatencyGoodMaxMs",
    audit_latency_warn_max_ms AS "auditLatencyWarnMaxMs"
  FROM settings AS s
  LEFT JOIN settings_i18n AS s_i18n_lang
    ON s_i18n_lang.settings_id = s.id
    AND s_i18n_lang.language_code = $1
  LEFT JOIN settings_i18n AS s_i18n_default
    ON s_i18n_default.settings_id = s.id
    AND s_i18n_default.language_code = $2
  LEFT JOIN settings_i18n AS s_i18n_uk
    ON s_i18n_uk.settings_id = s.id
    AND s_i18n_uk.language_code = 'uk'
  LEFT JOIN settings_i18n AS s_i18n_en
    ON s_i18n_en.settings_id = s.id
    AND s_i18n_en.language_code = 'en'
  ORDER BY s.id ASC
  LIMIT 1
`;

const LEGACY_ADMIN_SETTINGS_SELECT_LOCALIZED = `
  SELECT
    COALESCE(s_i18n_lang.title, s_i18n_default.title, s.title) AS title,
    COALESCE(s_i18n_lang.about, s_i18n_default.about, s.about) AS about,
    COALESCE(s_i18n_lang.mission, s_i18n_default.mission, s.mission) AS mission,
    COALESCE(s_i18n_uk.title, s.title) AS "titleUk",
    COALESCE(s_i18n_en.title, s_i18n_uk.title, s.title) AS "titleEn",
    COALESCE(s_i18n_uk.about, s.about) AS "aboutUk",
    COALESCE(s_i18n_en.about, s_i18n_uk.about, s.about) AS "aboutEn",
    COALESCE(s_i18n_uk.mission, s.mission) AS "missionUk",
    COALESCE(s_i18n_en.mission, s_i18n_uk.mission, s.mission) AS "missionEn",
    email,
    header_logo_url AS "headerLogoUrl",
    footer_logo_url AS "footerLogoUrl",
    hero_main_logo_data_url AS "heroMainLogoDataUrl",
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_hcaptcha_secret_key AS "contactCaptchaHcaptchaSecretKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    contact_captcha_recaptcha_secret_key AS "contactCaptchaRecaptchaSecretKey",
    COALESCE(s_i18n_lang.contact_captcha_error_message, s_i18n_default.contact_captcha_error_message, s.contact_captcha_error_message) AS "contactCaptchaErrorMessage",
    COALESCE(s_i18n_lang.contact_captcha_missing_token_message, s_i18n_default.contact_captcha_missing_token_message, s.contact_captcha_missing_token_message) AS "contactCaptchaMissingTokenMessage",
    COALESCE(s_i18n_lang.contact_captcha_invalid_domain_message, s_i18n_default.contact_captcha_invalid_domain_message, s.contact_captcha_invalid_domain_message) AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain"
  FROM settings AS s
  LEFT JOIN settings_i18n AS s_i18n_lang
    ON s_i18n_lang.settings_id = s.id
    AND s_i18n_lang.language_code = $1
  LEFT JOIN settings_i18n AS s_i18n_default
    ON s_i18n_default.settings_id = s.id
    AND s_i18n_default.language_code = $2
  LEFT JOIN settings_i18n AS s_i18n_uk
    ON s_i18n_uk.settings_id = s.id
    AND s_i18n_uk.language_code = 'uk'
  LEFT JOIN settings_i18n AS s_i18n_en
    ON s_i18n_en.settings_id = s.id
    AND s_i18n_en.language_code = 'en'
  ORDER BY s.id ASC
  LIMIT 1
`;

const ADMIN_SETTINGS_SELECT = `
  SELECT
    title,
    about,
    mission,
    email,
    header_logo_url AS "headerLogoUrl",
    footer_logo_url AS "footerLogoUrl",
    hero_main_logo_data_url AS "heroMainLogoDataUrl",
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_hcaptcha_secret_key AS "contactCaptchaHcaptchaSecretKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    contact_captcha_recaptcha_secret_key AS "contactCaptchaRecaptchaSecretKey",
    contact_captcha_error_message AS "contactCaptchaErrorMessage",
    contact_captcha_missing_token_message AS "contactCaptchaMissingTokenMessage",
    contact_captcha_invalid_domain_message AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain",
    audit_latency_good_max_ms AS "auditLatencyGoodMaxMs",
    audit_latency_warn_max_ms AS "auditLatencyWarnMaxMs"
  FROM settings
  ORDER BY id ASC
  LIMIT 1
`;

const LEGACY_ADMIN_SETTINGS_SELECT = `
  SELECT
    title,
    about,
    mission,
    email,
    header_logo_url AS "headerLogoUrl",
    footer_logo_url AS "footerLogoUrl",
    hero_main_logo_data_url AS "heroMainLogoDataUrl",
    instagram_url AS "instagramUrl",
    youtube_url AS "youtubeUrl",
    soundcloud_url AS "soundcloudUrl",
    radio_url AS "radioUrl",
    contact_captcha_enabled AS "contactCaptchaEnabled",
    contact_captcha_active_provider AS "contactCaptchaActiveProvider",
    contact_captcha_hcaptcha_site_key AS "contactCaptchaHcaptchaSiteKey",
    contact_captcha_hcaptcha_secret_key AS "contactCaptchaHcaptchaSecretKey",
    contact_captcha_recaptcha_site_key AS "contactCaptchaRecaptchaSiteKey",
    contact_captcha_recaptcha_secret_key AS "contactCaptchaRecaptchaSecretKey",
    contact_captcha_error_message AS "contactCaptchaErrorMessage",
    contact_captcha_missing_token_message AS "contactCaptchaMissingTokenMessage",
    contact_captcha_invalid_domain_message AS "contactCaptchaInvalidDomainMessage",
    contact_captcha_allowed_domain AS "contactCaptchaAllowedDomain"
  FROM settings
  ORDER BY id ASC
  LIMIT 1
`;

async function queryAdminSettings(queryable, requestedLanguage = config.defaultLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);

  const isI18nUnavailable = (error) => {
    const code = String(error && error.code ? error.code : "").trim();
    const message = String(error && error.message ? error.message : "").toLowerCase();
    if (code === "42P01" && message.includes("settings_i18n")) return true;
    if (code === "42703" && message.includes("s_i18n_")) return true;
    return false;
  };

  try {
    const result = await queryable.query(ADMIN_SETTINGS_SELECT_LOCALIZED, [language, defaultLanguage]);
    return withDefaultAuditLatencySettings(result.rows[0] || null);
  } catch (error) {
    if (isMissingAuditLatencyColumnsError(error)) {
      try {
        const localizedLegacyResult = await queryable.query(LEGACY_ADMIN_SETTINGS_SELECT_LOCALIZED, [language, defaultLanguage]);
        return withDefaultAuditLatencySettings(localizedLegacyResult.rows[0] || null);
      } catch (localizedLegacyError) {
        if (!isI18nUnavailable(localizedLegacyError)) throw localizedLegacyError;
      }
    } else if (!isI18nUnavailable(error)) {
      throw error;
    }

    try {
      const result = await queryable.query(ADMIN_SETTINGS_SELECT);
      return withDefaultAuditLatencySettings(result.rows[0] || null);
    } catch (legacyError) {
      if (!isMissingAuditLatencyColumnsError(legacyError)) throw legacyError;
      const result = await queryable.query(LEGACY_ADMIN_SETTINGS_SELECT);
      return withDefaultAuditLatencySettings(result.rows[0] || null);
    }
  }
}

export async function getPublicSettings(requestedLanguage = config.defaultLanguage) {
  const language = resolveLanguage(requestedLanguage);
  const defaultLanguage = resolveLanguage(config.defaultLanguage);
  const result = await pool.query(PUBLIC_SETTINGS_SELECT, [language, defaultLanguage]);
  const baseSettings = result.rows[0] || null;
  if (!baseSettings) return null;

  const heroSubtitle = await getPublicHeroSubtitle(pool, language, defaultLanguage);
  return {
    ...baseSettings,
    heroSubtitle
  };
}

export async function getAdminSectionSettings() {
  try {
    const result = await pool.query(
      `SELECT
        base.section_key AS "sectionKey",
        base.sort_order AS "sortOrder",
        base.is_enabled AS "isEnabled",
        base.default_title AS "defaultTitle",
        i18n_uk.title AS "titleUk",
        i18n_en.title AS "titleEn",
        i18n_uk.nav_title AS "menuTitleUk",
        i18n_en.nav_title AS "menuTitleEn"
      FROM section_settings AS base
      LEFT JOIN section_settings_i18n AS i18n_uk
        ON i18n_uk.section_settings_id = base.id
       AND i18n_uk.language_code = 'uk'
      LEFT JOIN section_settings_i18n AS i18n_en
        ON i18n_en.section_settings_id = base.id
       AND i18n_en.language_code = 'en'
      ORDER BY base.sort_order ASC, base.id ASC`
    );

    return normalizeSectionSettingsForAdmin(result.rows);
  } catch (_error) {
    return normalizeSectionSettingsForAdmin([]);
  }
}

export async function getPublicSectionSettings(requestedLanguage = config.defaultLanguage) {
  const adminSettings = await getAdminSectionSettings();
  return normalizeSectionSettingsForPublic(adminSettings, requestedLanguage);
}

export async function saveSectionSettings(sectionsPayload) {
  const client = await pool.connect();

  await client.query("BEGIN");
  try {
    await upsertSectionSettings(client, sectionsPayload);

    await client.query("COMMIT");
    return await getAdminSectionSettings();
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function saveSettingsBundle(payload, requestedLanguage = config.defaultLanguage) {
  const client = await pool.connect();

  await client.query("BEGIN");
  try {
    await upsertAdminSettings(client, payload.settings, requestedLanguage);
    await upsertSectionSettings(client, payload.sections);
    await client.query("COMMIT");

    return {
      settings: await getAdminSettings(requestedLanguage),
      sections: await getAdminSectionSettings()
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export async function getAdminSettings(requestedLanguage = config.defaultLanguage) {
  const baseSettings = await queryAdminSettings(pool, requestedLanguage);
  if (!baseSettings) return null;
  const heroSubtitles = await getSettingsHeroSubtitles(pool);
  const normalized = {
    ...baseSettings,
    ...heroSubtitles
  };

  const fallbackTitle = String(normalized.title || "").trim();
  const fallbackAbout = String(normalized.about || "").trim();
  const fallbackMission = String(normalized.mission || "").trim();

  normalized.titleUk = String(normalized.titleUk ?? fallbackTitle).trim();
  normalized.titleEn = String(normalized.titleEn ?? normalized.titleUk ?? fallbackTitle).trim();
  normalized.aboutUk = String(normalized.aboutUk ?? fallbackAbout).trim();
  normalized.aboutEn = String(normalized.aboutEn ?? normalized.aboutUk ?? fallbackAbout).trim();
  normalized.missionUk = String(normalized.missionUk ?? fallbackMission).trim();
  normalized.missionEn = String(normalized.missionEn ?? normalized.missionUk ?? fallbackMission).trim();

  return normalized;
}

export async function saveSettings(payload, requestedLanguage = config.defaultLanguage) {
  const client = await pool.connect();

  await client.query("BEGIN");
  try {
    await upsertAdminSettings(client, payload, requestedLanguage);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return await getAdminSettings(requestedLanguage);
}

export async function createContactRequest(payload) {
  const result = await pool.query(
    "INSERT INTO contact_requests (name, email, subject, message, attachment_name, attachment_type, attachment_data, status) VALUES ($1, $2, $3, $4, $5, $6, $7, 'new') RETURNING *",
    [
      payload.name,
      payload.email,
      payload.subject,
      payload.message,
      payload.attachmentName || "",
      payload.attachmentType || "",
      payload.attachmentDataUrl || ""
    ]
  );
  return result.rows[0];
}

export async function listContactRequests() {
  const result = await pool.query(
    "SELECT id, name, email, subject, message, attachment_name AS \"attachmentName\", attachment_type AS \"attachmentType\", attachment_data AS \"attachmentDataUrl\", status, created_at FROM contact_requests ORDER BY created_at DESC"
  );
  return result.rows;
}

export async function updateContactRequestStatus(id, status) {
  const result = await pool.query(
    "UPDATE contact_requests SET status = $1 WHERE id = $2 RETURNING id, name, email, subject, message, attachment_name AS \"attachmentName\", attachment_type AS \"attachmentType\", attachment_data AS \"attachmentDataUrl\", status, created_at",
    [status, id]
  );
  return result.rows[0] || null;
}

export async function writeAuditLog({ entityType, entityId, action, actor, details }) {
  await pool.query(
    "INSERT INTO audit_logs (entity_type, entity_id, action, actor, details) VALUES ($1, $2, $3, $4, $5::jsonb)",
    [entityType, entityId ?? null, action, actor || "system", JSON.stringify(details || {})]
  );
}

export async function listAuditLogs({
  limit = 100,
  page = 1,
  q = "",
  action = "",
  entity = "",
  from = "",
  to = ""
} = {}) {
  const filters = [];
  const values = [];

  if (q) {
    values.push(`%${q}%`);
    const idx = values.length;
    filters.push(`(
      actor ILIKE $${idx}
      OR action ILIKE $${idx}
      OR entity_type ILIKE $${idx}
      OR CAST(entity_id AS TEXT) ILIKE $${idx}
    )`);
  }

  if (action) {
    values.push(action);
    filters.push(`action = $${values.length}`);
  }

  if (entity) {
    values.push(entity);
    filters.push(`entity_type = $${values.length}`);
  }

  if (from) {
    values.push(`${from}T00:00:00`);
    filters.push(`created_at >= $${values.length}::timestamptz`);
  }

  if (to) {
    values.push(`${to}T23:59:59.999`);
    filters.push(`created_at <= $${values.length}::timestamptz`);
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
  const offset = (Math.max(1, Number(page) || 1) - 1) * (Number(limit) || 100);

  values.push(Number(limit) || 100);
  const limitPlaceholder = `$${values.length}`;
  values.push(offset);
  const offsetPlaceholder = `$${values.length}`;

  const query = `
    SELECT
      id,
      entity_type,
      entity_id,
      action,
      actor,
      CASE
        WHEN details IS NULL THEN jsonb_build_object('isCompact', true)
        WHEN jsonb_typeof(details) <> 'object' THEN jsonb_build_object(
          'isCompact',
          true,
          'valuePreview',
          left(details::text, 512)
        )
        ELSE jsonb_strip_nulls(jsonb_build_object(
          'isCompact', true,
          'source', CASE
            WHEN jsonb_typeof(details->'source') = 'string' THEN left(details->>'source', 120)
            ELSE NULL
          END,
          'hasDiff', CASE
            WHEN details ? 'diff' THEN true
            ELSE NULL
          END,
          'settingsChangedCount', CASE
            WHEN jsonb_typeof(details->'diff'->'settings'->'changedCount') = 'number'
              THEN (details->'diff'->'settings'->>'changedCount')::int
            ELSE NULL
          END,
          'sectionsChangedRowCount', CASE
            WHEN jsonb_typeof(details->'diff'->'sections'->'changedRowCount') = 'number'
              THEN (details->'diff'->'sections'->>'changedRowCount')::int
            ELSE NULL
          END
        ))
      END AS details,
      created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT ${limitPlaceholder} OFFSET ${offsetPlaceholder}
  `;

  const countQuery = `SELECT COUNT(*)::int AS total FROM audit_logs ${whereClause}`;

  const [itemsResult, countResult] = await Promise.all([
    pool.query(query, values),
    pool.query(countQuery, values.slice(0, values.length - 2))
  ]);

  return {
    items: itemsResult.rows,
    total: countResult.rows[0]?.total || 0
  };
}

export async function listAuditFacets() {
  const [actionsResult, entitiesResult] = await Promise.all([
    pool.query(
      "SELECT DISTINCT action FROM audit_logs WHERE action IS NOT NULL AND action <> '' ORDER BY action ASC"
    ),
    pool.query(
      "SELECT DISTINCT entity_type FROM audit_logs WHERE entity_type IS NOT NULL AND entity_type <> '' ORDER BY entity_type ASC"
    )
  ]);

  return {
    actions: actionsResult.rows.map((row) => row.action),
    entities: entitiesResult.rows.map((row) => row.entity_type)
  };
}
