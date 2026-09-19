import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AppointmentRequestDetail,
  AppointmentRequestSummary,
  CoordinationLogEntry,
  DoctorAvailability,
} from '../models/appointment-request.model';

export type DoctorAcknowledgementAction = 'ACCEPT' | 'REJECT' | 'PROPOSE_ALTERNATIVE';

@Injectable({ providedIn: 'root' })
export class AppointmentRequestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/appointment-requests`;
  private readonly doctorAckBase = `${environment.apiBaseUrl}/api/doctor/acknowledgements`;

  listForHospital(hospitalId: string): Observable<AppointmentRequestSummary[]> {
    return this.http.get<AppointmentRequestSummary[]>(this.base, { params: { hospitalId } });
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
