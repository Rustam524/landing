import type { AppLanguage } from "@/lib/types/database";
import { ru } from "./dictionaries/ru";
import { kk } from "./dictionaries/kk";
import type { Dictionary } from "./dictionaries/ru";

const dictionaries: Record<AppLanguage, Dictionary> = { ru, kk };

export function getDictionary(language: AppLanguage): Dictionary {
  return dictionaries[language] ?? dictionaries.ru;
}

export type { Dictionary };
