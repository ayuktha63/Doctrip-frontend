import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  HospitalAdminHospital,
  OperationalSettings,
  OperationalSettingsRequest,
} from '../models/hospital-admin.model';

/** Hospital record + operational settings — the two `/hospital` endpoints. */
@Injectable({ providedIn: 'root' })
export class HospitalAdminHospitalService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/hospital`;

  get(): Observable<HospitalAdminHospital> {
    return this.http.get<HospitalAdminHospital>(this.base);
  }

  getOperationalSettings(): Observable<OperationalSettings> {
    return this.http.get<OperationalSettings>(`${this.base}/operational-settings`);
  }

  updateOperationalSettings(payload: OperationalSettingsRequest): Observable<OperationalSettings> {
    return this.http.put<OperationalSettings>(`${this.base}/operational-settings`, payload);
  }
}
