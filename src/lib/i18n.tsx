'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import en from '@/locales/en.json';
import id from '@/locales/id.json';

export type Language = 'en' | 'id';

export const translations = { en, id };

export type TranslationKey = keyof typeof en;

interface I18nContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>('en');

  useEffect(() => {
    const saved = localStorage.getItem('memly_lang') as Language;
    if (saved === 'en' || saved === 'id') {
      setLangState(saved);
    }
  }, []);

  const setLang = (newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem('memly_lang', newLang);
  };

  const t = (key: TranslationKey): string => {
    return translations[lang][key] || translations.en[key] || key;
  };

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      lang: 'en' as Language,
      setLang: () => {},
      t: (key: TranslationKey) => translations.en[key] || key,
    };
  }
  return context;
}

export function LanguageToggle() {
  const { lang, setLang } = useI18n();

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      background: 'rgba(0, 0, 0, 0.04)',
      border: '1px solid var(--border-color-medium)',
      borderRadius: 'var(--radius-pill)',
      padding: '2px',
      fontSize: '0.75rem',
      fontFamily: 'var(--font-mono)',
      userSelect: 'none',
    }}>
      <button
        type="button"
        onClick={() => setLang('en')}
        style={{
          background: lang === 'en' ? 'var(--color-charcoal)' : 'transparent',
          color: lang === 'en' ? 'var(--color-paper-white)' : 'var(--text-secondary)',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '0.2rem 0.55rem',
          fontSize: '0.725rem',
          fontWeight: lang === 'en' ? 700 : 500,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        EN
      </button>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', margin: '0 1px' }}>|</span>
      <button
        type="button"
        onClick={() => setLang('id')}
        style={{
          background: lang === 'id' ? 'var(--color-charcoal)' : 'transparent',
          color: lang === 'id' ? 'var(--color-paper-white)' : 'var(--text-secondary)',
          border: 'none',
          borderRadius: 'var(--radius-pill)',
          padding: '0.2rem 0.55rem',
          fontSize: '0.725rem',
          fontWeight: lang === 'id' ? 700 : 500,
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        ID
      </button>
    </div>
  );
}
