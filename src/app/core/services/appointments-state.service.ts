import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ToastService } from './toast.service';
import {
  AppointmentRequestDetail,
  AppointmentRequestStatus as BackendStatus,
  AppointmentRequestSummary,
  PatientAppointmentsService,
} from './patient-appointments.service';
import { Appointment, AppointmentLogEntry, AppointmentStatus, NotificationItem } from '../models/appointment.model';

const STATUS_META: Record<AppointmentStatus, [string, string, string]> = {
  requested: ['Requested', '#1A6DF0', '#EAF1FE'],
  coordinating: ['In coordination', '#7C3AED', '#F1EAFE'],
  awaitingPatient: ['Awaiting your confirmation', '#0891B2', '#E3F5F9'],
  confirmed: ['Confirmed', '#16A34A', '#E7F6EC'],
  cancelled: ['Cancelled', '#DC2626', '#FCECEC'],
  expired: ['Expired', '#9AA4B2', '#F1F5FA'],
};

/** Backend's AppointmentRequestStatus -> this app's existing display-status buckets/labels. */
const BACKEND_STATUS_MAP: Record<BackendStatus, AppointmentStatus> = {
  REQUESTED: 'requested',
  DOCTOR_COORDINATION: 'coordinating',
  DOCTOR_SELECTED: 'awaitingPatient',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  // No exact existing bucket for "no doctor accepted, coordination closed" — 'expired' is the
  // closest existing label/styling (closed, nothing further happens automatically).
  ESCALATED: 'expired',
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

function whenLabel(date: string, time: string): string {
  const d = new Date(`${date}T${time.length === 5 ? time + ':00' : time}`);
  const datePart = d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  const timePart = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  return `${datePart}, ${timePart}`;
}

function summaryToAppointment(r: AppointmentRequestSummary): Appointment {
  return {
    id: r.id,
    code: r.requestCode,
    treatment: r.department,
    hospital: r.hospitalName ?? 'To be confirmed',
    dept: r.department,
    doctor: r.requestedDoctorName || 'Not assigned',
    when: whenLabel(r.requestedDate, r.requestedTime),
    submitted: '',
    status: BACKEND_STATUS_MAP[r.status],
    log: [],
  };
}

function detailToAppointment(r: AppointmentRequestDetail, log: AppointmentLogEntry[]): Appointment {
  const when =
    r.securedDate && r.securedTime ? whenLabel(r.securedDate, r.securedTime) : whenLabel(r.requestedDate, r.requestedTime);
  return {
    id: r.id,
    code: r.requestCode,
    treatment: r.healthcareRequirement,
    hospital: r.hospitalName,
    dept: r.department,
    doctor: r.securedDoctorName || r.requestedDoctorName || 'Not assigned',
    when,
    submitted: formatDate(r.createdAt),
    status: BACKEND_STATUS_MAP[r.status],
    log,
  };
}

/**
 * "My appointments" — backed by the real `/api/patient/appointment-requests` API
 * (PatientAppointmentsService), scoped to whichever patient is currently signed in (the backend
 * enforces this via the bearer token's patient id, never a client-supplied filter). Nothing here
 * is mock data.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentsStateService {
  private readonly api = inject(PatientAppointmentsService);
  private readonly toast = inject(ToastService);

  readonly appointments = signal<Appointment[]>([]);
  readonly loading = signal(false);
  readonly loadError = signal<string | null>(null);

  readonly currentAppointmentId = signal<string>('');
  private readonly currentDetail = signal<Appointment | null>(null);
  readonly detailLoading = signal(false);

  readonly decoratedAppointments = computed(() => this.appointments().map((a) => this.decorate(a)));

  readonly currentAppointment = computed(() => {
    const detail = this.currentDetail();
    if (detail && detail.id === this.currentAppointmentId()) {
      return this.decorate(detail);
    }
    const fallback = this.appointments().find((a) => a.id === this.currentAppointmentId());
    return this.decorate(fallback ?? this.emptyAppointment());
  });

  /** No backend notifications endpoint exists yet — kept empty rather than fabricated. */
  readonly notifications = computed<NotificationItem[]>(() => []);
  readonly notifRead = signal(true);
  readonly unreadCount = computed(() => 0);

  markAllRead(): void {
    this.notifRead.set(true);
  }

  load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    this.api.list().subscribe({
      next: (rows) => {
        this.appointments.set(rows.map(summaryToAppointment));
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadError.set(err.error?.message ?? 'Could not load your appointments.');
        this.loading.set(false);
      },
    });
  }

  loadDetail(id: string): void {
    this.currentAppointmentId.set(id);
    this.detailLoading.set(true);
    this.api.get(id).subscribe({
      next: (detail) => {
        this.api.getLog(id).subscribe({
          next: (log) => {
            this.currentDetail.set(detailToAppointment(detail, log));
            this.detailLoading.set(false);
          },
          error: () => {
            this.currentDetail.set(detailToAppointment(detail, []));
            this.detailLoading.set(false);
          },
        });
      },
      error: (err: HttpErrorResponse) => {
        this.detailLoading.set(false);
        this.toast.show(err.error?.message ?? 'Could not load this appointment.');
      },
    });
  }

  cancel(id: string): void {
    this.api.cancel(id).subscribe({
      next: (detail) => {
        this.replaceFromDetail(detail);
        this.toast.show('Appointment cancelled.');
      },
      error: (err: HttpErrorResponse) => this.toast.show(err.error?.message ?? 'Could not cancel this appointment.'),
    });
  }

  /** Patient Confirmation — the real backend action behind the mockup's "pay" step; there is no
   * separate payment gateway integration, so confirming IS locking the appointment in. */
  confirm(id: string): Observable<Appointment> {
    return new Observable<Appointment>((subscriber) => {
      this.api.confirm(id).subscribe({
        next: (detail) => {
          this.replaceFromDetail(detail);
          subscriber.next(this.currentAppointment());
          subscriber.complete();
        },
        error: (err: HttpErrorResponse) => subscriber.error(err),
      });
    });
  }

  private replaceFromDetail(detail: AppointmentRequestDetail): void {
    const updated = detailToAppointment(detail, this.currentDetail()?.log ?? []);
    this.currentDetail.set(updated);
    this.appointments.update((list) => list.map((a) => (a.id === detail.id ? { ...a, status: updated.status } : a)));
  }

  private emptyAppointment(): Appointment {
    return {
      id: '',
      code: '',
      treatment: '',
      hospital: '',
      dept: '',
      doctor: '',
      when: '',
      submitted: '',
      status: 'requested',
      log: [],
    };
  }

  private decorate(a: Appointment) {
    const [statusLabel, accent, tint] = STATUS_META[a.status];
    const nudge: Record<AppointmentStatus, string> = {
      requested: 'Waiting for the hospital',
      coordinating: 'Hospital is coordinating',
      awaitingPatient: 'Needs your confirmation',
      confirmed: 'All set',
      cancelled: 'Closed',
      expired: 'Closed',
    };
    return {
      ...a,
      statusLabel,
      accent,
      tint,
      whenLabel: a.status === 'confirmed' || a.status === 'awaitingPatient' ? 'Appointment' : 'Requested for',
      needsYou: a.status === 'awaitingPatient',
      nudge: nudge[a.status],
    };
  }
}
