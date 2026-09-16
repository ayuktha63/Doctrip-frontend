import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Hospital, HospitalRequest, HospitalStatusRequest } from '../models/hospital.model';

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/hospitals`;

  list(): Observable<Hospital[]> {
    return this.http.get<Hospital[]>(this.base);
  }

  get(id: string): Observable<Hospital> {
    return this.http.get<Hospital>(`${this.base}/${id}`);
  }

  create(payload: HospitalRequest): Observable<Hospital> {
    return this.http.post<Hospital>(this.base, payload);
  }

  update(id: string, payload: HospitalRequest): Observable<Hospital> {
    return this.http.put<Hospital>(`${this.base}/${id}`, payload);
  }

  setStatus(id: string, payload: HospitalStatusRequest): Observable<Hospital> {
    return this.http.post<Hospital>(`${this.base}/${id}/status`, payload);
  }
}
