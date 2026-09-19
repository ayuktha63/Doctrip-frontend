import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { DashboardKpis, DashboardSummary } from '../models/hospital-admin.model';

/**
 * Dashboard "Coordination desk" — GET /dashboard/summary. `slaBreaches`/`kpis` are cached here
 * (not just read by the Dashboard component) so the shell's top-bar breach badge and sidebar
 * "Requests" open-count badge (HospitalAdmin.dc.html's `openCount` pill) can show without a
 * second HTTP call, and stay populated on every screen, not just after visiting Dashboard.
 */
@Injectable({ providedIn: 'root' })
export class HospitalAdminDashboardService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/dashboard`;

  private readonly _slaBreaches = signal(0);
  readonly slaBreaches = this._slaBreaches.asReadonly();

  private readonly _kpis = signal<DashboardKpis | null>(null);

  /** Mirrors the mockup's `openCount = count('new') + count('coordinating') + count('awaitingDoctor')`
   *  — requests still somewhere in the pipeline before a doctor is secured. */
  readonly openRequests = computed(() => {
    const kpis = this._kpis();
    return kpis ? kpis.newRequests + kpis.inCoordination + kpis.awaitingDoctor : 0;
  });

  getSummary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/summary`).pipe(
      tap((summary) => {
        this._slaBreaches.set(summary.kpis.slaBreaches);
        this._kpis.set(summary.kpis);
      }),
    );
  }
}
