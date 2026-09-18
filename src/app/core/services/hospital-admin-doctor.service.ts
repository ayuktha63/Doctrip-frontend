import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Doctor, DoctorRequest, StatusRequest } from '../models/hospital-admin.model';

@Injectable({ providedIn: 'root' })
export class HospitalAdminDoctorService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/doctors`;

  list(): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(this.base);
  }

  create(payload: DoctorRequest): Observable<Doctor> {
    return this.http.post<Doctor>(this.base, payload);
  }

  update(id: string, payload: DoctorRequest): Observable<Doctor> {
    return this.http.put<Doctor>(`${this.base}/${id}`, payload);
  }

  setStatus(id: string, payload: StatusRequest): Observable<Doctor> {
    return this.http.patch<Doctor>(`${this.base}/${id}/status`, payload);
  }
}
