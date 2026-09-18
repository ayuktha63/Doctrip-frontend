import { InjectionToken } from '@angular/core';
import { environment } from '../../../environments/environment';

/**
 * Frontend integration boundary for backend configuration, used by the
 * Story 2 discovery services (treatments/hospitals/doctors). Wraps
 * `environment.apiBaseUrl` — the same base URL AuthService uses — so
 * discovery and auth always target the same backend.
 */
export interface AppConfig {
  apiBaseUrl: string;
}

export const APP_CONFIG = new InjectionToken<AppConfig>('APP_CONFIG', {
  factory: () => ({ apiBaseUrl: environment.apiBaseUrl }),
});
