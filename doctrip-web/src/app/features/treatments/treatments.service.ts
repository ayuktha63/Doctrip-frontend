import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { TreatmentPackage } from './treatment-package.model';

/**
 * Frontend integration boundary for treatment package discovery
 * (FE-WEB-2.1 listing / FE-WEB-2.2 details — story_2.md "Treatment
 * Packages").
 *
 * UNDEFINED backend contract — not implemented here, and not guessed at:
 * - No confirmed API endpoints for listing or fetching a single
 *   treatment package.
 * - No confirmed response schema (field names/types, pagination).
 * - No confirmed server-side mechanism for approved/published filtering.
 * - No confirmed way to distinguish "not found" from "temporarily
 *   unavailable" from a generic technical failure for a single package.
 *
 * Per story_2.md ("Public discovery data shall be available without
 * requiring a patient session"), these calls must never require
 * authentication once implemented — no auth token/header should be
 * attached here.
 *
 * Until the contract above is confirmed, these methods do not call a
 * guessed endpoint and do not return mock data (per instruction: mock
 * data must not be used to make this feature appear functional). They
 * surface a clear, catchable error so the UI can honestly show its
 * error state instead of appearing to work.
 */
@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private readonly config = inject(APP_CONFIG);

  getTreatmentPackages(): Observable<TreatmentPackage[]> {
    return throwError(() => new Error(this.unconfiguredMessage('list')));
  }

  getTreatmentPackageById(_id: string): Observable<TreatmentPackage> {
    return throwError(() => new Error(this.unconfiguredMessage('detail')));
  }

  private unconfiguredMessage(kind: 'list' | 'detail'): string {
    const subject = kind === 'list' ? 'Treatment package discovery' : 'Treatment package detail';
    return this.config.apiBaseUrl
      ? `${subject} endpoint is not yet defined.`
      : `${subject} API is not yet configured (no backend base URL/contract confirmed).`;
  }
}
