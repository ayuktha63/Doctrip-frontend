import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { Doctor } from './doctor.model';

/**
 * Frontend integration boundary for doctor discovery (FE-WEB-2.6
 * listing / FE-WEB-2.7 search / FE-WEB-2.8 profile — story_2.md
 * "Doctors").
 *
 * Confirmed backend contract, verified live against the running
 * backend:
 * - GET {apiBaseUrl}/api/public/doctors — list
 * - GET {apiBaseUrl}/api/public/doctors?name=<text> — search
 *   (case-insensitive substring match on name)
 * - GET {apiBaseUrl}/api/public/doctors/{id} — detail; 404 JSON error
 *   body for an unknown id
 *
 * Per story_2.md ("Doctor discovery shall not require authentication"),
 * these calls must never require authentication — no auth token/header
 * is attached here.
 */
@Injectable({ providedIn: 'root' })
export class DoctorsService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);

  getDoctors(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.config.apiBaseUrl}/api/public/doctors`);
  }

  searchDoctors(query: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.config.apiBaseUrl}/api/public/doctors`, {
      params: { name: query },
    });
  }

  getDoctorById(id: string): Observable<Doctor> {
    return this.http.get<Doctor>(`${this.config.apiBaseUrl}/api/public/doctors/${id}`);
  }
}
