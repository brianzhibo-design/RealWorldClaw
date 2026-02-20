"use client";
import { createContext, useContext, useState, ReactNode } from "react";

export type Locale = "en" | "zh";

const LocaleContext = createContext<{ locale: Locale; toggle: () => void }>({
  locale: "zh",
  toggle: () => {},
});

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("zh");
  const toggle = () => setLocale((l) => (l === "en" ? "zh" : "en"));
  return (
    <LocaleContext.Provider value={{ locale, toggle }}>
      {children}
    </LocaleContext.Provider>
  );
}

export function useLocale() {
  return useContext(LocaleContext);
}

export function t(obj: { en: string; zh: string }, locale: Locale): string {
  return obj[locale];
}
