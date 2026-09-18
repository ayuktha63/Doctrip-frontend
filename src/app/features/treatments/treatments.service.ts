import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { TreatmentPackage } from './treatment-package.model';

/**
 * Frontend integration boundary for treatment package discovery
 * (FE-WEB-2.1 listing / FE-WEB-2.2 details — story_2.md "Treatment
 * Packages").
 *
 * Confirmed backend contract:
 * - GET {apiBaseUrl}/api/public/treatment-packages — list
 * - GET {apiBaseUrl}/api/public/treatment-packages/{id} — detail; 404
 *   JSON error body for an unknown id
 *
 * Per story_2.md ("Public discovery data shall be available without
 * requiring a patient session"), these calls must never require
 * authentication — no auth token/header is attached here.
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

  getTreatmentPackageById(id: string): Observable<TreatmentPackage> {
    return this.http.get<TreatmentPackage>(
      `${this.config.apiBaseUrl}/api/public/treatment-packages/${id}`,
    );
  }
}
