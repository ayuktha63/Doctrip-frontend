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

@Injectable({ providedIn: 'root' })
export class AppointmentRequestService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/appointment-requests`;

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
}
