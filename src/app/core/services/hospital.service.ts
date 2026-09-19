import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Hospital, HospitalRequest, HospitalStatusRequest } from '../models/hospital.model';

export interface HospitalAdminAccountRequest {
  hospitalId: string;
  email: string;
  name: string;
  password: string;
}

export interface HospitalAdminAccountUpdateRequest {
  name: string;
  email: string;
  /** Blank leaves the current password unchanged. */
  password: string;
}

export interface HospitalAdminAccount {
  id: string;
  hospitalId: string;
  email: string;
  name: string;
  active: boolean;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class HospitalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/hospitals`;
  private readonly hospitalAdminsBase = `${environment.apiBaseUrl}/api/admin/hospital-admins`;

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

  /** Provisions the login this hospital's Hospital Admin console (/hospital-admin) uses. */
  createAdminAccount(payload: HospitalAdminAccountRequest): Observable<HospitalAdminAccount> {
    return this.http.post<HospitalAdminAccount>(this.hospitalAdminsBase, payload);
  }

  /** The (at most one, per current provisioning flow) Hospital Admin account for this hospital. */
  getAdminAccounts(hospitalId: string): Observable<HospitalAdminAccount[]> {
    return this.http.get<HospitalAdminAccount[]>(this.hospitalAdminsBase, { params: { hospitalId } });
  }

  updateAdminAccount(id: string, payload: HospitalAdminAccountUpdateRequest): Observable<HospitalAdminAccount> {
    return this.http.put<HospitalAdminAccount>(`${this.hospitalAdminsBase}/${id}`, payload);
  }
}
