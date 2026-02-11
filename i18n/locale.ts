import { Pathnames } from "next-intl/routing";

export const locales = ["en", "zh"];

export const localeNames: any = {
  zh: "中文",
  en: "English",
};

export const defaultLocale = "zh";

export const localePrefix = "as-needed";

export const localeDetection =
  process.env.NEXT_PUBLIC_LOCALE_DETECTION === "true";

export const pathnames = {
  en: {
    "privacy-policy": "/privacy-policy",
    "terms-of-service": "/terms-of-service",
  },
  zh: {
    "privacy-policy": "/privacy-policy",
    "terms-of-service": "/terms-of-service",
  },
} satisfies Pathnames<typeof locales>;
