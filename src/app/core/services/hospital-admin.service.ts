import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
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

  /**
   * Session-scoped cache of this hospital's DocTrip-Admin-set "Hide data" flag — populated by the
   * first screen in this console that calls `get()` (or `refreshDataHidden()` directly) each
   * session, so every screen that needs to grey itself out (doctors/treatments/departments/
   * dashboard) can just read this signal instead of each making its own `/hospital` call.
   */
  private readonly _dataHidden = signal(false);
  readonly dataHidden = this._dataHidden.asReadonly();

  get(): Observable<HospitalAdminHospital> {
    return this.http
      .get<HospitalAdminHospital>(this.base)
      .pipe(tap((h) => this._dataHidden.set(h.dataHidden)));
  }

  /** Cheap way for a screen to make sure `dataHidden` is fresh without needing the full record. */
  refreshDataHidden(): void {
    this.get().subscribe({ error: () => {} });
  }

  getOperationalSettings(): Observable<OperationalSettings> {
    return this.http.get<OperationalSettings>(`${this.base}/operational-settings`);
  }

  updateOperationalSettings(payload: OperationalSettingsRequest): Observable<OperationalSettings> {
    return this.http.put<OperationalSettings>(`${this.base}/operational-settings`, payload);
  }
}
