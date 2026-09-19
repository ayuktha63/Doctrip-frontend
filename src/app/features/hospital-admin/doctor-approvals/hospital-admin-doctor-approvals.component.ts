import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  AppointmentRequestService,
  DoctorAcknowledgementAction,
} from '../../../core/services/appointment-request.service';
import { HospitalAdminAuthService } from '../../../core/services/hospital-admin-auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { PendingAcknowledgement } from '../../../core/models/appointment-request.model';

/**
 * "Doctor approvals" — sidebar screen listing every acknowledgement still awaiting a doctor's
 * response, across every in-progress request for this hospital. No Doctor login/UI exists yet
 * (see backend DoctorAcknowledgementController's doc comment), so Hospital Admin records the
 * response here on a doctor's behalf — the exact same accept/reject/propose-alternative rules the
 * real Doctor UI will drive through this same endpoint once it exists. Separate from the request
 * detail's own "Eligible doctors" card, which stays a read-only view of who was contacted.
 */
@Component({
  selector: 'app-hospital-admin-doctor-approvals',
  standalone: true,
  templateUrl: './hospital-admin-doctor-approvals.component.html',
})
export class HospitalAdminDoctorApprovalsComponent implements OnInit {
  private readonly appointmentRequestService = inject(AppointmentRequestService);
  private readonly auth = inject(HospitalAdminAuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly acknowledgements = signal<PendingAcknowledgement[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly respondingAckId = signal<string | null>(null);
  protected readonly proposingAckId = signal<string | null>(null);
  protected readonly proposedDate = signal('');
  protected readonly proposedTime = signal('');

  ngOnInit(): void {
    const hospitalId = this.auth.hospitalId();
    if (hospitalId) this.load(hospitalId);
    else this.loading.set(false);
  }

  private load(hospitalId: string): void {
    this.loading.set(true);
    this.appointmentRequestService.listPendingAcknowledgements(hospitalId).subscribe({
      next: (list) => {
        this.acknowledgements.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private reload(): void {
    const hospitalId = this.auth.hospitalId();
    if (hospitalId) this.load(hospitalId);
  }

  initials(name: string): string {
    const parts = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  statusLabel(status: string): string {
    return status === 'ALTERNATIVE_PROPOSED' ? 'Proposed alternative' : 'Awaiting response';
  }

  openRequest(ack: PendingAcknowledgement): void {
    this.router.navigate(['/hospital-admin/requests', ack.appointmentRequestId]);
  }

  respondAsDoctor(ackId: string, action: DoctorAcknowledgementAction, proposedDate?: string, proposedTime?: string): void {
    this.respondingAckId.set(ackId);
    this.appointmentRequestService.respondAsDoctor(ackId, action, proposedDate, proposedTime).subscribe({
      next: () => {
        this.respondingAckId.set(null);
        this.proposingAckId.set(null);
        this.toast.show(
          action === 'ACCEPT'
            ? 'Doctor accepted — securing the appointment.'
            : action === 'REJECT'
              ? 'Doctor rejected the request.'
              : 'Alternative slot proposed.',
        );
        this.reload();
      },
      error: (err) => {
        this.respondingAckId.set(null);
        this.toast.show(err?.error?.message ?? 'Could not record the doctor response. Please try again.');
      },
    });
  }

  openPropose(ackId: string): void {
    this.proposingAckId.set(ackId);
    this.proposedDate.set('');
    this.proposedTime.set('');
  }

  cancelPropose(): void {
    this.proposingAckId.set(null);
  }

  submitPropose(ackId: string): void {
    if (!this.proposedDate() || !this.proposedTime()) {
      this.toast.show('Pick a date and time to propose.');
      return;
    }
    this.respondAsDoctor(ackId, 'PROPOSE_ALTERNATIVE', this.proposedDate(), this.proposedTime());
  }
}
