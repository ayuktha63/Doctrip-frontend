import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslationService } from '../../core/services/translation.service';

/**
 * `{{ 'auth.welcomeBack' | translate }}` — impure so it re-evaluates whenever
 * `TranslationService.currentDictionary` changes (Angular's default pipe purity would otherwise
 * cache the first result and never re-render on a live language switch).
 */
@Pipe({
  name: 'translate',
  standalone: true,
  pure: false,
})
export class TranslatePipe implements PipeTransform {
  private readonly translation = inject(TranslationService);

  transform(key: string | null | undefined): string {
    if (!key) {
      return '';
    }
    return this.translation.translate(key);
  }
}
