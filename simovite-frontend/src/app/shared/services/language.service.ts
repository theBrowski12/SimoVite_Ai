import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type SupportedLang = 'en' | 'fr' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {

  readonly languages = [
    { code: 'en' as SupportedLang, label: 'English', flag: '🇬🇧', dir: 'ltr' },
    { code: 'fr' as SupportedLang, label: 'Français', flag: '🇫🇷', dir: 'ltr' },
    { code: 'ar' as SupportedLang, label: 'العربية',  flag: '🇲🇦', dir: 'rtl' },
  ];

  constructor(private translate: TranslateService) {}

  init(): void {
    this.translate.addLangs(['en', 'fr', 'ar']);
    this.translate.setDefaultLang('fr');

    // Load saved language or detect browser language
    const saved = localStorage.getItem('simovite_lang') as SupportedLang;
    const browser = this.translate.getBrowserLang() as SupportedLang;
    const lang = saved || (['en','fr','ar'].includes(browser) ? browser : 'fr');

    this.setLanguage(lang);
  }

  setLanguage(lang: SupportedLang): void {
    this.translate.use(lang);
    localStorage.setItem('simovite_lang', lang);

    // ✅ Handle RTL for Arabic
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
  }

  getCurrentLang(): SupportedLang {
    return this.translate.currentLang as SupportedLang || 'fr';
  }

  isRTL(): boolean {
    return this.getCurrentLang() === 'ar';
  }
}