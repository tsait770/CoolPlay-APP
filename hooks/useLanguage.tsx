import React, { useState, useEffect, ReactNode, useMemo, useCallback } from "react";
import createContextHook from "@nkzw/create-context-hook";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

export type Language = "en" | "zh-TW" | "zh-CN" | "es" | "pt-BR" | "pt" | "de" | "fr" | "ru" | "ar" | "ja" | "ko";

const [LanguageContext, useLanguageContext] = createContextHook(() => {
  const [language, setLanguageState] = useState<Language>("en");
  const [isLoading, setIsLoading] = useState(true);

  const isValidLanguage = useCallback((lang: string): boolean => {
    const validLanguages: Language[] = ["en", "zh-TW", "zh-CN", "es", "pt-BR", "pt", "de", "fr", "ru", "ar", "ja", "ko"];
    return validLanguages.includes(lang as Language);
  }, []);

  const loadLanguage = useCallback(async () => {
    try {
      setIsLoading(true);
      
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        // Web platform: use localStorage
        const savedLang = localStorage.getItem("app_language");
        if (savedLang && typeof savedLang === 'string' && savedLang.length > 0 && isValidLanguage(savedLang)) {
          setLanguageState(savedLang as Language);
        }
      } else {
        // Native platforms: use AsyncStorage
        const savedLang = await AsyncStorage.getItem("app_language");
        if (savedLang && typeof savedLang === 'string' && savedLang.length > 0 && isValidLanguage(savedLang)) {
          setLanguageState(savedLang as Language);
        }
      }
    } catch (error) {
      console.error("Failed to load language:", error);
      // Clear corrupted data
      try {
        if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
          localStorage.removeItem("app_language");
        } else {
          await AsyncStorage.removeItem("app_language");
        }
      } catch (clearError) {
        console.error("Failed to clear corrupted language data:", clearError);
      }
    } finally {
      setIsLoading(false);
    }
  }, [isValidLanguage]);

  useEffect(() => {
    loadLanguage();
  }, [loadLanguage]);

  const setLanguage = useCallback(async (lang: Language) => {
    if (!lang?.trim() || lang.length > 10) return;
    const sanitizedLang = lang.trim() as Language;
    
    if (!isValidLanguage(sanitizedLang)) return;
    
    try {
      // Update state immediately for responsive UI
      setLanguageState(sanitizedLang);
      
      // Persist to storage
      if (Platform.OS === 'web' && typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem("app_language", sanitizedLang);
      } else {
        await AsyncStorage.setItem("app_language", sanitizedLang);
      }
      
      console.log(`Language changed to: ${sanitizedLang}`);
    } catch (error) {
      console.error("Failed to save language:", error);
      // Revert on error
      setLanguageState(language);
    }
  }, [isValidLanguage, language]);

  return useMemo(() => ({ language, setLanguage, isLoading }), [language, setLanguage, isLoading]);
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  return <LanguageContext>{children}</LanguageContext>;
}

export function useLanguage() {
  return useLanguageContext();
}