import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Frontend integration boundary for backend configuration.
 *
 * UNDEFINED: apiBaseUrl has no confirmed value — no backend API contract
 * exists yet for treatments, hospitals, doctors, or auth (docs/story_2.md,
 * Dependencies section). Set this once that contract is confirmed.
 */
export interface AppConfig {
  apiBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiBaseUrl: environment.apiBaseUrl }),
});
