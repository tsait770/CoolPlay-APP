import React from "react";
import { useLanguage } from "./useLanguage";

// Import translations using static imports
import enTranslations from "@/l10n/en.json";
import zhTWTranslations from "@/l10n/zh-TW.json";
import zhCNTranslations from "@/l10n/zh-CN.json";
import esTranslations from "@/l10n/es.json";
import ptBRTranslations from "@/l10n/pt-BR.json";
import ptTranslations from "@/l10n/pt.json";
import deTranslations from "@/l10n/de.json";
import frTranslations from "@/l10n/fr.json";
import ruTranslations from "@/l10n/ru.json";
import arTranslations from "@/l10n/ar.json";
import jaTranslations from "@/l10n/ja.json";
import koTranslations from "@/l10n/ko.json";

// Fallback translations
const fallbackTranslations = {
  "app_name": "CoolPlay",
  "home": "Home",
  "favorites": "Favorites",
  "player": "Player",
  "community": "Community",
  "settings": "Settings",
  "language": "Language",
  "subtitle": "Your Smart Bookmark Manager",
  "all_bookmarks": "All Bookmarks",
  "total_bookmarks": "Total Bookmarks",
  "total_folders": "Total Folders",
  "voice_commands": "Voice Commands",
};

const translations = {
  "en": { ...fallbackTranslations, ...enTranslations },
  "zh-TW": { ...fallbackTranslations, ...zhTWTranslations },
  "zh-CN": { ...fallbackTranslations, ...zhCNTranslations },
  "es": { ...fallbackTranslations, ...esTranslations },
  "pt-BR": { ...fallbackTranslations, ...ptBRTranslations },
  "pt": { ...fallbackTranslations, ...ptTranslations },
  "de": { ...fallbackTranslations, ...deTranslations },
  "fr": { ...fallbackTranslations, ...frTranslations },
  "ru": { ...fallbackTranslations, ...ruTranslations },
  "ar": { ...fallbackTranslations, ...arTranslations },
  "ja": { ...fallbackTranslations, ...jaTranslations },
  "ko": { ...fallbackTranslations, ...koTranslations },
};

export function useTranslation() {
  const { language } = useLanguage();

  const t = React.useCallback((key: string): string => {
    try {
      const translation = translations[language as keyof typeof translations] || translations["en"];
      return (translation as Record<string, string>)[key] || fallbackTranslations[key as keyof typeof fallbackTranslations] || key;
    } catch (error) {
      console.error(`Translation error for key "${key}" in language "${language}":`, error);
      return fallbackTranslations[key as keyof typeof fallbackTranslations] || key;
    }
  }, [language]);

  return { t };
}