import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { Hospital } from './hospital.model';

/**
 * Frontend integration boundary for hospital discovery (FE-WEB-2.3
 * listing / FE-WEB-2.4 search / FE-WEB-2.5 profile — story_2.md
 * "Hospitals").
 *
 * Confirmed backend contract, same conventions as TreatmentsService:
 * - GET {apiBaseUrl}/api/public/hospitals — list
 * - GET {apiBaseUrl}/api/public/hospitals?name=<text> — search
 *   (case-insensitive substring match on name)
 * - GET {apiBaseUrl}/api/public/hospitals/{id} — detail; 404 JSON error
 *   body for an unknown id
 *
 * Per story_2.md ("Hospital discovery shall not require authentication"),
 * these calls must never require authentication — no auth token/header
 * is attached here.
 */
@Injectable({ providedIn: 'root' })
export class HospitalsService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);

  getHospitals(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(`${this.config.apiBaseUrl}/api/public/hospitals`);
  }

  searchHospitals(query: string): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(`${this.config.apiBaseUrl}/api/public/hospitals`, {
      params: { name: query },
    });
  }

  getHospitalById(id: string): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.config.apiBaseUrl}/api/public/hospitals/${id}`);
  }
}
