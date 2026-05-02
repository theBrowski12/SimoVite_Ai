import { Component } from '@angular/core';
import { LanguageService, SupportedLang } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  templateUrl: './language-switcher.html',
  styleUrls: ['./language-switcher.scss'],
  standalone: false
})
export class LanguageSwitcherComponent {
  isDropdownOpen = false;

  constructor(public langService: LanguageService) {}

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  closeDropdown(): void {
    this.isDropdownOpen = false;
  }

  switch(lang: SupportedLang): void {
    this.langService.setLanguage(lang);
    this.closeDropdown();
  }

  getCurrentLanguage() {
    return this.langService.languages.find(l => l.code === this.langService.getCurrentLang()) || this.langService.languages[1]; // Default to FR if not found
  }
}