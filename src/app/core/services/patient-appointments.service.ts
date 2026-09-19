import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export type AppointmentRequestStatus =
  | 'REQUESTED'
  | 'DOCTOR_COORDINATION'
  | 'DOCTOR_SELECTED'
  | 'ESCALATED'
  | 'CANCELLED'
  | 'CONFIRMED';

export interface AppointmentRequestSummary {
  id: string;
  requestCode: string;
  hospitalName: string | null;
  patientName: string;
  patientCountry: string | null;
  department: string;
  requestedDoctorName: string | null;
  requestedDate: string;
  requestedTime: string;
  status: AppointmentRequestStatus;
  adminSlaDeadline: string;
  adminSlaBreached: boolean;
}

export interface DoctorAcknowledgementSummary {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  status: string;
  sentAt: string;
  responseDeadline: string;
  proposedDate: string | null;
  proposedTime: string | null;
}

export interface AppointmentRequestDetail {
  id: string;
  requestCode: string;
  patientId: string;
  patientName: string;
  patientCountry: string | null;
  patientAge: number | null;
  patientGender: string | null;
  hospitalId: string;
  hospitalName: string;
  department: string;
  requestedDoctorName: string | null;
  requestedDate: string;
  requestedTime: string;
  healthcareRequirement: string;
  additionalInfo: string | null;
  requiredDocuments: string[];
  status: AppointmentRequestStatus;
  adminSlaDeadline: string;
  adminSlaBreached: boolean;
  createdAt: string;
  updatedAt: string;
  coordination: DoctorAcknowledgementSummary[];
  securedDoctorName: string | null;
  securedDate: string | null;
  securedTime: string | null;
}

export interface CoordinationLogEntry {
  title: string;
  time: string;
  body: string;
}

export interface AppointmentRequestCreatePayload {
  discoveryHospitalId: number;
  department: string;
  requestedDoctorName?: string;
  requestedDate: string;
  requestedTime: string;
  healthcareRequirement: string;
  additionalInfo?: string;
  patientCountry?: string;
  patientAge?: number;
  requiredDocuments?: string[];
}

/** Patient's own appointment requests — "My appointments" and the discover -> booking flow's submit step. */
@Injectable({ providedIn: 'root' })
export class PatientAppointmentsService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/patient/appointment-requests`;

  list(): Observable<AppointmentRequestSummary[]> {
    return this.http.get<AppointmentRequestSummary[]>(this.base);
  }

  get(id: string): Observable<AppointmentRequestDetail> {
    return this.http.get<AppointmentRequestDetail>(`${this.base}/${id}`);
  }

  getLog(id: string): Observable<CoordinationLogEntry[]> {
    return this.http.get<CoordinationLogEntry[]>(`${this.base}/${id}/log`);
  }

  create(payload: AppointmentRequestCreatePayload): Observable<AppointmentRequestDetail> {
    return this.http.post<AppointmentRequestDetail>(this.base, payload);
  }

  cancel(id: string): Observable<AppointmentRequestDetail> {
    return this.http.post<AppointmentRequestDetail>(`${this.base}/${id}/cancel`, {});
  }

  confirm(id: string): Observable<AppointmentRequestDetail> {
    return this.http.post<AppointmentRequestDetail>(`${this.base}/${id}/confirm`, {});
  }
}
