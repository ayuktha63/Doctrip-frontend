import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { APP_CONFIG } from '../../core/config/app-config.token';
import { DepartmentDetail, DepartmentSummary } from './department.model';

/**
 * Frontend integration boundary for the "Departments" discover tab.
 *
 * Confirmed backend contract, same conventions as HospitalsService/DoctorsService/
 * TreatmentsService:
 * - GET {apiBaseUrl}/api/public/departments — list, real counts/hospital names
 * - GET {apiBaseUrl}/api/public/departments/{name} — drill-in detail; 404 JSON error for an
 *   unknown department name
 *
 * Public — never requires authentication, matching every other discovery endpoint.
 */
@Injectable({ providedIn: 'root' })
export class DepartmentsService {
  private readonly config = inject(APP_CONFIG);
  private readonly http = inject(HttpClient);

  list(): Observable<DepartmentSummary[]> {
    return this.http.get<DepartmentSummary[]>(`${this.config.apiBaseUrl}/api/public/departments`);
  }

  getByName(name: string): Observable<DepartmentDetail> {
    return this.http.get<DepartmentDetail>(
      `${this.config.apiBaseUrl}/api/public/departments/${encodeURIComponent(name)}`,
    );
  }
}
