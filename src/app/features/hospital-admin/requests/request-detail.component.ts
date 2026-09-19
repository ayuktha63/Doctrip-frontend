import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentRequestService, DoctorAcknowledgementAction } from '../../../core/services/appointment-request.service';
import { ToastService } from '../../../core/services/toast.service';
import {
  AppointmentRequestDetail,
  CoordinationLogEntry,
  DoctorAvailability,
} from '../../../core/models/appointment-request.model';

/**
 * FR-01 — Hospital Admin reviewing a single appointment request, matching the fields laid out in
 * the reference mockup's isCoord "Patient and requirement" / "What the patient asked for" cards.
 * FR-02/FR-04/FR-05 — checking doctor availability and starting coordination (sends the requested
 * doctor an acknowledgement request if eligible/available, otherwise fans out simultaneously to
 * every eligible doctor in the department). FR-06 (accept/reject/alternative) belongs to the
 * Doctor's own story and isn't built here — acknowledgement rows just stay "Pending" for now.
 */
@Component({
  selector: 'app-request-detail',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './request-detail.component.html',
})
export class RequestDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentRequestService = inject(AppointmentRequestService);
  private readonly toast = inject(ToastService);

  protected readonly request = signal<AppointmentRequestDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly availability = signal<DoctorAvailability | null>(null);
  protected readonly availabilityLoading = signal(false);
  protected readonly starting = signal(false);
  protected readonly resolving = signal(false);
  protected readonly log = signal<CoordinationLogEntry[]>([]);

  /** No Doctor login exists yet — these back the "Simulate doctor response" controls on each
   *  pending acknowledgement, standing in for the real Doctor UI (see AppointmentRequestService
   *  .respondAsDoctor's doc comment). */
  protected readonly respondingAckId = signal<string | null>(null);
  protected readonly proposingAckId = signal<string | null>(null);
  protected readonly proposedDate = signal('');
  protected readonly proposedTime = signal('');

  private id!: string;

  protected readonly patientFields = computed(() => {
    const r = this.request();
    if (!r) return [];
    return [
      { k: 'Name', v: r.patientName },
      { k: 'Age', v: r.patientAge != null ? String(r.patientAge) : '—' },
      { k: 'Gender', v: r.patientGender ?? '—' },
      { k: 'Country', v: r.patientCountry ?? '—' },
    ];
  });

  protected readonly requestFields = computed(() => {
    const r = this.request();
    if (!r) return [];
    return [
      { k: 'Hospital', v: r.hospitalName },
      { k: 'Department', v: r.department },
      { k: 'Requested doctor', v: r.requestedDoctorName ?? 'No preference' },
      { k: 'Requested date', v: r.requestedDate },
      { k: 'Requested time', v: r.requestedTime },
      { k: 'Submitted', v: new Date(r.createdAt).toLocaleString() },
    ];
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.goBack();
      return;
    }
    this.id = id;
    this.loadRequest();
  }

  private loadRequest(): void {
    this.appointmentRequestService.get(this.id).subscribe({
      next: (detail) => {
        this.request.set(detail);
        this.loading.set(false);
        if (detail.status === 'REQUESTED') this.loadAvailability();
        this.loadLog();
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  private loadLog(): void {
    this.appointmentRequestService.log(this.id).subscribe({
      next: (entries) => this.log.set(entries),
      error: () => this.log.set([]),
    });
  }

  private loadAvailability(): void {
    this.availabilityLoading.set(true);
    this.appointmentRequestService.doctorAvailability(this.id).subscribe({
      next: (a) => {
        this.availability.set(a);
        this.availabilityLoading.set(false);
      },
      error: () => this.availabilityLoading.set(false),
    });
  }

  startCoordination(): void {
    this.starting.set(true);
    this.appointmentRequestService.startCoordination(this.id).subscribe({
      next: (detail) => {
        this.request.set(detail);
        this.starting.set(false);
        this.toast.show(
          detail.requestedDoctorName && detail.coordination.length === 1
            ? `Acknowledgement request sent to ${detail.coordination[0].doctorName}.`
            : `Acknowledgement requests sent to ${detail.coordination.length} eligible doctors.`,
        );
        this.loadLog();
      },
      error: (err) => {
        this.starting.set(false);
        this.toast.show(err?.error?.message ?? 'Could not start doctor coordination. Please try again.');
      },
    });
  }

  resolveAlternative(): void {
    this.resolving.set(true);
    this.appointmentRequestService.resolveAlternative(this.id).subscribe({
      next: (detail) => {
        this.request.set(detail);
        this.resolving.set(false);
        this.toast.show(`Secured ${detail.securedDoctorName} for ${detail.securedDate} ${detail.securedTime}.`);
        this.loadLog();
      },
      error: (err) => {
        this.resolving.set(false);
        this.toast.show(err?.error?.message ?? 'Could not select an alternative slot. Please try again.');
      },
    });
  }

  respondAsDoctor(ackId: string, action: DoctorAcknowledgementAction, proposedDate?: string, proposedTime?: string): void {
    this.respondingAckId.set(ackId);
    this.appointmentRequestService.respondAsDoctor(ackId, action, proposedDate, proposedTime).subscribe({
      next: (detail) => {
        this.request.set(detail);
        this.respondingAckId.set(null);
        this.proposingAckId.set(null);
        this.toast.show(
          action === 'ACCEPT'
            ? 'Doctor accepted — securing the appointment.'
            : action === 'REJECT'
              ? 'Doctor rejected the request.'
              : 'Alternative slot proposed.',
        );
        this.loadLog();
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

  goBack(): void {
    this.router.navigate(['/hospital-admin/requests']);
  }

  statusLabel(): string {
    const status = this.request()?.status;
    if (status === 'DOCTOR_SELECTED') return 'Doctor selected';
    if (status === 'ESCALATED') return 'Escalated';
    if (status === 'CANCELLED') return 'Cancelled';
    if (status === 'CONFIRMED') return 'Confirmed';
    if (status === 'DOCTOR_COORDINATION') return 'Doctor coordination';
    if (status === 'REQUESTED') return 'Requested';
    return status ?? '';
  }

  protected readonly alternativeProposals = computed(
    () => this.request()?.coordination.filter((c) => c.status === 'ALTERNATIVE_PROPOSED') ?? [],
  );

  /**
   * "Eligible doctors" card (mockup's isCoord {@code cur.candidates}) — before coordination starts
   * this is the availability preview, after it starts it's the doctors actually contacted. Real
   * per-doctor experience/open-slot-count fields from the mockup aren't shown: {@code
   * CoordinationDoctor} (see backend CLAUDE.md) is a minimal placeholder with no such data, so
   * fabricating it here would just be decoration with no backing source.
   */
  protected readonly eligibleCandidates = computed(() => {
    const r = this.request();
    if (!r) return [];
    if (r.status === 'REQUESTED') {
      const a = this.availability();
      if (!a) return [];
      return a.eligibleDoctors.map((d) => ({
        key: d.doctorId,
        name: d.name,
        specialty: d.specialty ?? 'Specialty n/a',
        isRequested: !!r.requestedDoctorName && d.name.toLowerCase() === r.requestedDoctorName.toLowerCase(),
        statusLabel: 'Available',
        statusColor: '#16A34A',
        pending: false,
      }));
    }
    return r.coordination.map((c) => ({
      key: c.id,
      name: c.doctorName,
      specialty: c.doctorSpecialty ?? 'Specialty n/a',
      isRequested: !!r.requestedDoctorName && c.doctorName.toLowerCase() === r.requestedDoctorName.toLowerCase(),
      statusLabel: this.ackStatusLabel(c.status),
      statusColor: this.ackStatusColor(c.status),
      pending: c.status === 'PENDING',
    }));
  });

  /** Only PENDING acks in an in-progress (DOCTOR_COORDINATION) request can still be responded to. */
  protected readonly canRespondAsDoctor = computed(() => this.request()?.status === 'DOCTOR_COORDINATION');

  initials(name: string): string {
    const parts = name.replace(/^Dr\.?\s*/i, '').trim().split(/\s+/);
    return parts
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase() ?? '')
      .join('');
  }

  private ackStatusLabel(status: string): string {
    switch (status) {
      case 'PENDING':
        return 'Awaiting response';
      case 'ACCEPTED':
        return 'Accepted';
      case 'REJECTED':
        return 'Declined';
      case 'ALTERNATIVE_PROPOSED':
        return 'Proposed alternative';
      case 'CLOSED':
        return 'Closed';
      default:
        return status;
    }
  }

  private ackStatusColor(status: string): string {
    switch (status) {
      case 'ACCEPTED':
        return '#16A34A';
      case 'REJECTED':
      case 'CLOSED':
        return '#9AA4B2';
      case 'ALTERNATIVE_PROPOSED':
        return '#B26A00';
      default:
        return '#1A6DF0';
    }
  }
}
