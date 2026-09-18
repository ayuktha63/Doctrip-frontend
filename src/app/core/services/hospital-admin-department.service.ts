import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Department, DepartmentRequest, StatusRequest } from '../models/hospital-admin.model';

@Injectable({ providedIn: 'root' })
export class HospitalAdminDepartmentService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/departments`;

  list(): Observable<Department[]> {
    return this.http.get<Department[]>(this.base);
  }

  create(payload: DepartmentRequest): Observable<Department> {
    return this.http.post<Department>(this.base, payload);
  }

  update(id: string, payload: DepartmentRequest): Observable<Department> {
    return this.http.put<Department>(`${this.base}/${id}`, payload);
  }

  setStatus(id: string, payload: StatusRequest): Observable<Department> {
    return this.http.patch<Department>(`${this.base}/${id}/status`, payload);
  }
}
