import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { TreatmentPackage } from './treatment-package.model';

/**
 * Frontend integration boundary for treatment package discovery
 * (FE-WEB-2.1 listing / FE-WEB-2.2 details — story_2.md "Treatment
 * Packages").
 *
 * Confirmed backend contract for FE-WEB-2.1:
 * - GET {apiBaseUrl}/api/public/treatment-packages
 *
 * Per story_2.md ("Public discovery data shall be available without
 * requiring a patient session"), this call must never require
 * authentication — no auth token/header is attached here.
 *
 * getTreatmentPackageById remains unimplemented: no confirmed backend
 * contract exists yet for fetching a single treatment package
 * (FE-WEB-2.2, out of scope here).
 */
@Injectable({ providedIn: 'root' })
export class TreatmentsService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);

  getTreatmentPackages(): Observable<TreatmentPackage[]> {
    return this.http.get<TreatmentPackage[]>(
      `${this.config.apiBaseUrl}/api/public/treatment-packages`,
    );
  }

  getTreatmentPackageById(_id: string): Observable<TreatmentPackage> {
    return throwError(() => new Error(this.unconfiguredMessage('detail')));
  }

  private unconfiguredMessage(kind: 'detail'): string {
    const subject = 'Treatment package detail';
    return this.config.apiBaseUrl
      ? `${subject} endpoint is not yet defined.`
      : `${subject} API is not yet configured (no backend base URL/contract confirmed).`;
  }
}
