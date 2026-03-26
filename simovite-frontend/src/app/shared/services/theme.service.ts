import { Injectable } from "@angular/core";

// shared/services/theme.service.ts
@Injectable({ providedIn: 'root' })
export class ThemeService {
  toggle(): void {
    const current = document.documentElement.getAttribute('data-theme');
    document.documentElement.setAttribute(
      'data-theme', current === 'dark' ? 'light' : 'dark'
    );
    localStorage.setItem('theme', current === 'dark' ? 'light' : 'dark');
  }
}