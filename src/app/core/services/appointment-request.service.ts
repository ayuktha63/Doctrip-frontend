import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AppointmentRequestDetail,
  AppointmentRequestSummary,
  CoordinationLogEntry,
  DoctorAvailability,
  PendingAcknowledgement,
} from '../models/appointment-request.model';

export type DoctorAcknowledgementAction = 'ACCEPT' | 'REJECT' | 'PROPOSE_ALTERNATIVE';

@Injectable({ providedIn: 'root' })
export class AppointmentRequestService {
  private readonly http = inject(HttpClient);
  /**
   * Moved from `/api/admin/appointment-requests` — that path sat under Story 3's blanket-open
   * `/api/admin/**` prefix with a client-supplied `hospitalId`, letting any caller read or mutate
   * any hospital's coordination queue by guessing/iterating ids. Now under the real Hospital Admin
   * JWT session (`hospitalAdminAuthInterceptor` attaches the bearer token for any `/api/hospital-admin`
   * URL); the backend derives `hospitalId` from that token, never a query param.
   */
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/appointment-requests`;
  private readonly doctorAckBase = `${environment.apiBaseUrl}/api/doctor/acknowledgements`;

  /** Cached so the sidebar "Doctor approvals" badge can show a count without every screen making
   *  its own call — refreshed whenever listPendingAcknowledgements() runs (the shell calls it
   *  once on load; the approvals screen itself refreshes it after every response). */
  private readonly _pendingAcknowledgementsCount = signal(0);
  readonly pendingAcknowledgementsCount = this._pendingAcknowledgementsCount.asReadonly();

  listForHospital(): Observable<AppointmentRequestSummary[]> {
    return this.http.get<AppointmentRequestSummary[]>(this.base);
  }

  get(id: string): Observable<AppointmentRequestDetail> {
    return this.http.get<AppointmentRequestDetail>(`${this.base}/${id}`);
  }

  doctorAvailability(id: string): Observable<DoctorAvailability> {
    return this.http.get<DoctorAvailability>(`${this.base}/${id}/doctor-availability`);
  }

  startCoordination(id: string): Observable<AppointmentRequestDetail> {
    return this.http.post<AppointmentRequestDetail>(`${this.base}/${id}/coordination/start`, {});
  }

  resolveAlternative(id: string): Observable<AppointmentRequestDetail> {
    return this.http.post<AppointmentRequestDetail>(`${this.base}/${id}/coordination/resolve-alternative`, {});
  }

  log(id: string): Observable<CoordinationLogEntry[]> {
    return this.http.get<CoordinationLogEntry[]>(`${this.base}/${id}/log`);
  }

  /** "Doctor approvals" sidebar screen — every acknowledgement still awaiting a response, across
   *  every in-progress request for this hospital. */
  listPendingAcknowledgements(): Observable<PendingAcknowledgement[]> {
    return this.http
      .get<PendingAcknowledgement[]>(`${this.base}/pending-acknowledgements`)
      .pipe(tap((list) => this._pendingAcknowledgementsCount.set(list.length)));
  }

  /**
   * FR-06's doctor-side response (accept/reject/propose alternative) — no doctor login exists
   * yet (see backend DoctorAcknowledgementController's own doc comment), so this stands in for
   * it: Hospital Admin can record a response on a doctor's behalf, exercising the exact same
   * coordination rules (atomic first-acceptance-wins, alternative resolution) that the real
   * Doctor UI will call through this same endpoint once it exists.
   */
  respondAsDoctor(
    acknowledgementId: string,
    action: DoctorAcknowledgementAction,
    proposedDate?: string,
    proposedTime?: string,
  ): Observable<AppointmentRequestDetail> {
    return this.http.post<AppointmentRequestDetail>(`${this.doctorAckBase}/${acknowledgementId}/respond`, {
      action,
      proposedDate: proposedDate ?? null,
      proposedTime: proposedTime ?? null,
    });
  }
}
