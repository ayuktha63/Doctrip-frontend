import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardSummary } from '../models/hospital-admin.model';

/**
 * Dashboard "Coordination desk" — GET /dashboard/summary. `slaBreaches` is cached here (not just
 * read by the Dashboard component) so the shell's top-bar breach badge can show it without a
 * second HTTP call.
 */
@Injectable({ providedIn: 'root' })
export class HospitalAdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/dashboard`;

  private readonly _slaBreaches = signal(0);
  readonly slaBreaches = this._slaBreaches.asReadonly();

  getSummary(): Observable<DashboardSummary> {
    return this.http
      .get<DashboardSummary>(`${this.base}/summary`)
      .pipe(tap((summary) => this._slaBreaches.set(summary.kpis.slaBreaches)));
  }
}
