import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Lang = 'de' | 'en' | 'pl' | 'fr' | 'es' | 'it' | 'nl' | 'tr';

const DEFAULT = 'de' as Lang;

const TRANSLATIONS: Record<Lang, Record<string, string>> = {
  de: {
    brandTitle: 'Autoteile-Dashboard',
    brandSubtitle: 'WhatsApp Assistent · Händleransicht',
    navOverview: 'Übersicht',
    navOrders: 'Bestellungen',
    logout: 'Logout',
    merchant: 'Händler',
    subtitleOffers: 'Angebote für Bestellung',
    titleOffers: 'Shop-Angebote',
    loading: 'Angebote werden geladen…',
    noOffers: 'Keine Angebote gefunden.',
    kpis: 'Kennzahlen',
    onboardingTitle: 'Onboarding & Grundeinstellungen',
    save: 'Speichern',
    saveAndFinish: 'Speichern & Abschließen',
    next: 'Weiter',
    back: 'Zurück',
    reset: 'Zurücksetzen',
    period: 'Zeitraum',
    standardMargin: 'Standard-Marge (%)',
    shopsSelect: 'Shops auswählen',
    chooseLanguagePrompt: 'Sprache wählen',
  },
  en: {
    brandTitle: 'Auto Parts Dashboard',
    brandSubtitle: 'WhatsApp Assistant · Merchant View',
    navOverview: 'Overview',
    navOrders: 'Orders',
    logout: 'Logout',
    merchant: 'Merchant',
    subtitleOffers: 'Offers for order',
    titleOffers: 'Shop Offers',
    loading: 'Loading offers…',
    noOffers: 'No offers found.',
    kpis: 'KPIs',
    onboardingTitle: 'Onboarding & Settings',
    save: 'Save',
    saveAndFinish: 'Save & Finish',
    next: 'Next',
    back: 'Back',
    reset: 'Reset',
    period: 'Time range',
    standardMargin: 'Default Margin (%)',
    shopsSelect: 'Select shops',
    chooseLanguagePrompt: 'Choose language',
  },
  pl: {
    brandTitle: 'Panel Części Samochodowych',
    brandSubtitle: 'Asystent WhatsApp · Widok sprzedawcy',
    navOverview: 'Przegląd',
    navOrders: 'Zamówienia',
    logout: 'Wyloguj',
    merchant: 'Sprzedawca',
    subtitleOffers: 'Oferty dla zamówienia',
    titleOffers: 'Oferty sklepów',
    loading: 'Ładowanie ofert…',
    noOffers: 'Brak ofert.',
    kpis: 'Wskaźniki',
    onboardingTitle: 'Onboarding i Ustawienia',
    save: 'Zapisz',
    saveAndFinish: 'Zapisz i zakończ',
    next: 'Dalej',
    back: 'Wstecz',
    reset: 'Resetuj',
    period: 'Zakres czasu',
    standardMargin: 'Domyślna marża (%)',
    shopsSelect: 'Wybierz sklepy',
    chooseLanguagePrompt: 'Wybierz język',
  },
  // zusätzliche Sprachen reuse-en/de Texte, damit Auswahl möglich ist
  fr: {},
  es: {},
  it: {},
  nl: {},
  tr: {}
};

const KEY = 'dashboard_lang';

export const languageOptions: Array<{ code: Lang; label: string }> = [
  { code: 'de', label: 'Deutsch' },
  { code: 'en', label: 'English' },
  { code: 'pl', label: 'Polski' },
  { code: 'fr', label: 'Français' },
  { code: 'es', label: 'Español' },
  { code: 'it', label: 'Italiano' },
  { code: 'nl', label: 'Nederlands' },
  { code: 'tr', label: 'Türkçe' }
];

const I18nContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
} | null>(null);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    try {
      const raw = localStorage.getItem(KEY);
      return (raw as Lang) || DEFAULT;
    } catch {
      return DEFAULT;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(KEY, lang);
    } catch {}
  }, [lang]);

  const setLang = (l: Lang) => setLangState(l);

  const t = (key: string) => {
    return TRANSLATIONS[lang][key] ?? TRANSLATIONS[DEFAULT][key] ?? key;
  };

  const value = useMemo(() => ({ lang, setLang, t }), [lang]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

export type { Lang };
