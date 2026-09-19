import { Injectable, effect, signal } from '@angular/core';

export type LanguageCode = 'en' | 'hi' | 'ml' | 'ar';

export const LANGUAGES: { code: LanguageCode; label: string; nativeLabel: string; rtl: boolean }[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', rtl: false },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', rtl: false },
  { code: 'ml', label: 'Malayalam', nativeLabel: 'മലയാളം', rtl: false },
  { code: 'ar', label: 'Arabic', nativeLabel: 'العربية', rtl: true },
];

const STORAGE_KEY = 'doctrip_language';

type Dictionary = Record<string, string>;

/**
 * Lightweight runtime i18n service. Not build-time $localize — this app is a client-only SPA that
 * needs to flip language live without a rebuild/reload, so each language's flat key->string
 * dictionary is fetched as a plain JSON asset and swapped into a signal. `TranslatePipe` reads
 * `currentDictionary()` so every `| translate` usage in a template updates automatically when the
 * language signal changes.
 */
@Injectable({ providedIn: 'root' })
export class TranslationService {
  readonly language = signal<LanguageCode>(this.readInitialLanguage());
  readonly currentDictionary = signal<Dictionary>({});

  private readonly cache = new Map<LanguageCode, Dictionary>();

  constructor() {
    effect(() => {
      const lang = this.language();
      this.applyDomAttributes(lang);
      void this.loadLanguage(lang);
    });
  }

  setLanguage(lang: LanguageCode): void {
    if (lang === this.language()) {
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* ignore (private browsing / storage disabled) */
    }
    this.language.set(lang);
  }

  translate(key: string): string {
    return this.currentDictionary()[key] ?? key;
  }

  private async loadLanguage(lang: LanguageCode): Promise<void> {
    const cached = this.cache.get(lang);
    if (cached) {
      this.currentDictionary.set(cached);
      return;
    }
    try {
      const res = await fetch(`i18n/${lang}.json`);
      const dict = (await res.json()) as Dictionary;
      this.cache.set(lang, dict);
      if (this.language() === lang) {
        this.currentDictionary.set(dict);
      }
    } catch {
      if (lang !== 'en') {
        this.currentDictionary.set({});
      }
    }
  }

  private applyDomAttributes(lang: LanguageCode): void {
    if (typeof document === 'undefined') {
      return;
    }
    const meta = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', meta?.rtl ? 'rtl' : 'ltr');
  }

  private readInitialLanguage(): LanguageCode {
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as LanguageCode | null;
      if (stored && LANGUAGES.some((l) => l.code === stored)) {
        return stored;
      }
    } catch {
      /* ignore */
    }
    return 'en';
  }
}
