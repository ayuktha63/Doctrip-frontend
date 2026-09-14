import { Injectable, inject } from '@angular/core';
import { Observable, throwError } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { Hospital } from './hospital.model';

/**
 * Frontend integration boundary for hospital discovery (FE-WEB-2.3
 * listing / FE-WEB-2.4 search / FE-WEB-2.5 profile — story_2.md
 * "Hospitals").
 *
 * UNDEFINED backend contract — not implemented here, and not guessed at:
 * - No confirmed API endpoints for listing, searching, or fetching a
 *   single hospital.
 * - No confirmed response schema (field names/types, pagination).
 * - No confirmed server-side mechanism for approved/published filtering.
 * - No confirmed search semantics (fields searched, matching rules,
 *   minimum query length, etc.) — story_2.md leaves "search/filter
 *   requirements not confirmed" as TBD.
 * - No confirmed way to distinguish "not found" from "temporarily
 *   unavailable" from a generic technical failure for a single hospital.
 *
 * Per story_2.md ("Hospital discovery shall not require authentication",
 * "Visitor/Patient can search hospitals on Website", "Visitor/Patient
 * can view hospital details/profile"), these calls must never require
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
export class HospitalsService {
  private readonly config = inject(APP_CONFIG);

  getHospitals(): Observable<Hospital[]> {
    return throwError(() => new Error(this.unconfiguredMessage('list')));
  }

  searchHospitals(_query: string): Observable<Hospital[]> {
    return throwError(() => new Error(this.unconfiguredMessage('search')));
  }

  getHospitalById(_id: string): Observable<Hospital> {
    return throwError(() => new Error(this.unconfiguredMessage('detail')));
  }

  private unconfiguredMessage(kind: 'list' | 'search' | 'detail'): string {
    const subject =
      kind === 'list' ? 'Hospital discovery' : kind === 'search' ? 'Hospital search' : 'Hospital profile';
    return this.config.apiBaseUrl
      ? `${subject} endpoint is not yet defined.`
      : `${subject} API is not yet configured (no backend base URL/contract confirmed).`;
  }
}
