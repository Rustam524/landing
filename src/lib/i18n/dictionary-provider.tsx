"use client";

import { createContext, useContext } from "react";
import type { Dictionary } from "./get-dictionary";
import type { AppLanguage } from "@/lib/types/database";

const DictionaryContext = createContext<{
  dict: Dictionary;
  language: AppLanguage;
} | null>(null);

export function DictionaryProvider({
  dict,
  language,
  children,
}: {
  dict: Dictionary;
  language: AppLanguage;
  children: React.ReactNode;
}) {
  return (
    <DictionaryContext.Provider value={{ dict, language }}>
      {children}
    </DictionaryContext.Provider>
  );
}

/** Access the current dictionary + language from any Client Component under a DictionaryProvider. */
export function useDictionary() {
  const ctx = useContext(DictionaryContext);
  if (!ctx) {
    throw new Error("useDictionary must be used within a DictionaryProvider");
  }
  return ctx;
}
