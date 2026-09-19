import { Component, inject } from '@angular/core';
import { LANGUAGES, LanguageCode, TranslationService } from '../../../core/services/translation.service';

/**
 * Small language selector following the app-shell header's inline-style visual language (same
 * border/radius/font tokens as the notification bell button). A native `<select>` rather than a
 * custom popover — this app has no click-outside/focus-trap utility yet, and a native select gets
 * keyboard/a11y support for free.
 */
@Component({
  selector: 'app-language-switcher',
  standalone: true,
  template: `
    <select
      [value]="translation.language()"
      (change)="onChange($event)"
      aria-label="Language"
      style="height: 36px; padding: 0 10px; border: 1px solid #E9EEF6; border-radius: 9px; background: #fff; color: #1F2A37; font-size: 12.5px; font-weight: 600; cursor: pointer"
    >
      @for (lang of languages; track lang.code) {
        <option [value]="lang.code">{{ lang.nativeLabel }}</option>
      }
    </select>
  `,
})
export class LanguageSwitcherComponent {
  protected readonly translation = inject(TranslationService);
  protected readonly languages = LANGUAGES;

  onChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value as LanguageCode;
    this.translation.setLanguage(value);
  }
}
