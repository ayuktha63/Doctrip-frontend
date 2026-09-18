import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { StatusRequest, Treatment, TreatmentRequest } from '../models/hospital-admin.model';

@Injectable({ providedIn: 'root' })
export class HospitalAdminTreatmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/treatments`;

  list(): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(this.base);
  }

  create(payload: TreatmentRequest): Observable<Treatment> {
    return this.http.post<Treatment>(this.base, payload);
  }

  update(id: string, payload: TreatmentRequest): Observable<Treatment> {
    return this.http.put<Treatment>(`${this.base}/${id}`, payload);
  }

  /** Body field is literally `active` even though it drives the "listed"/unlisted display state. */
  setStatus(id: string, payload: StatusRequest): Observable<Treatment> {
    return this.http.patch<Treatment>(`${this.base}/${id}/status`, payload);
  }
}
