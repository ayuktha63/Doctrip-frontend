import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
import { HospitalAdminAuthService } from '../../../core/services/hospital-admin-auth.service';
import { AppointmentRequestSummary } from '../../../core/models/appointment-request.model';

/**
 * FR-01 — Hospital Admin's "Appointment requests" list, matching the reference mockup's
 * isRequests block. Originally built (DT-6, Hospital Appointment Coordination) against
 * `HospitalAdminContextService`, a stopgap that picked the first hospital from DocTrip Admin's
 * list because no Hospital Admin login existed yet. Story 4 built that login, so this now sources
 * the hospitalId from the real JWT session instead.
 */
@Component({
  selector: 'app-request-list',
  standalone: true,
  templateUrl: './request-list.component.html',
})
export class RequestListComponent implements OnInit {
  private readonly appointmentRequestService = inject(AppointmentRequestService);
  private readonly auth = inject(HospitalAdminAuthService);
  private readonly router = inject(Router);

  protected readonly requests = signal<AppointmentRequestSummary[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly countLabel = computed(() => {
    const total = this.requests().length;
    return total === 1 ? '1 request' : `${total} requests`;
  });

  ngOnInit(): void {
    if (this.auth.hospitalId()) this.load();
    else {
      this.loadError.set(true);
      this.loading.set(false);
    }
  }

  private load(): void {
    this.loading.set(true);
    this.appointmentRequestService.listForHospital().subscribe({
      next: (list) => {
        this.requests.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  open(id: string): void {
    this.router.navigate(['/hospital-admin/requests', id]);
  }

  statusOf(status: AppointmentRequestSummary['status']): { label: string; fg: string; bg: string } {
    switch (status) {
      case 'DOCTOR_SELECTED':
        return { label: 'Doctor selected', fg: '#16A34A', bg: '#E7F6EC' };
      case 'ESCALATED':
        return { label: 'Escalated', fg: '#DC2626', bg: '#FCECEC' };
      case 'CANCELLED':
        return { label: 'Cancelled', fg: '#9AA4B2', bg: '#F1F5FA' };
      case 'CONFIRMED':
        return { label: 'Confirmed', fg: '#16A34A', bg: '#E7F6EC' };
      case 'DOCTOR_COORDINATION':
        return { label: 'Doctor coordination', fg: '#B26A00', bg: '#FFF6E6' };
      case 'REQUESTED':
      default:
        return { label: 'Requested', fg: '#1A6DF0', bg: '#EAF1FE' };
    }
  }

  slaOf(r: AppointmentRequestSummary): { label: string; color: string } {
    if (r.adminSlaBreached) return { label: 'SLA breached', color: '#DC2626' };
    const minutesLeft = Math.round((new Date(r.adminSlaDeadline).getTime() - Date.now()) / 60000);
    return { label: `${Math.max(minutesLeft, 0)}m left`, color: minutesLeft <= 15 ? '#B26A00' : '#6B7280' };
  }
}
