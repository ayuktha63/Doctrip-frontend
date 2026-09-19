import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppointmentRequestDetail, DoctorAvailability } from '../../../core/models/appointment-request.model';

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
export class RequestDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly appointmentRequestService = inject(AppointmentRequestService);
  private readonly toast = inject(ToastService);

  // The doctor acts entirely by email (Story 7) — Accept/Reject/Alternative all happen outside
  // this tab, so without polling the admin would only see the outcome on a manual refresh. Only
  // runs while the request is still waiting on a doctor; stopped once it reaches a resolved state.
  private static readonly POLL_INTERVAL_MS = 8000;
  private pollHandle: ReturnType<typeof setInterval> | null = null;

  protected readonly request = signal<AppointmentRequestDetail | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);

  protected readonly availability = signal<DoctorAvailability | null>(null);
  protected readonly availabilityLoading = signal(false);
  protected readonly starting = signal(false);
  protected readonly resolving = signal(false);

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
        this.syncPolling(detail.status);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  /** Silent background refresh — doesn't touch loading/error signals, so it never flickers the
   *  page while the admin is reading it. */
  private refreshQuietly(): void {
    this.appointmentRequestService.get(this.id).subscribe({
      next: (detail) => {
        this.request.set(detail);
        this.syncPolling(detail.status);
      },
      error: () => {
        // Transient network hiccup — leave the poll running, next tick will retry.
      },
    });
  }

  private syncPolling(status: string): void {
    const awaitingDoctor = status === 'DOCTOR_COORDINATION';
    if (awaitingDoctor && this.pollHandle === null) {
      this.pollHandle = setInterval(() => this.refreshQuietly(), RequestDetailComponent.POLL_INTERVAL_MS);
    } else if (!awaitingDoctor && this.pollHandle !== null) {
      clearInterval(this.pollHandle);
      this.pollHandle = null;
    }
  }

  ngOnDestroy(): void {
    if (this.pollHandle !== null) clearInterval(this.pollHandle);
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
        this.syncPolling(detail.status);
        this.starting.set(false);
        this.toast.show(
          detail.requestedDoctorName && detail.coordination.length === 1
            ? `Acknowledgement request sent to ${detail.coordination[0].doctorName}.`
            : `Acknowledgement requests sent to ${detail.coordination.length} eligible doctors.`,
        );
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
      },
      error: (err) => {
        this.resolving.set(false);
        this.toast.show(err?.error?.message ?? 'Could not select an alternative slot. Please try again.');
      },
    });
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
    if (status === 'DOCTOR_COORDINATION') return 'In coordination';
    if (status === 'REQUESTED') return 'Requested';
    return status ?? '';
  }

  protected readonly alternativeProposals = computed(
    () => this.request()?.coordination.filter((c) => c.status === 'ALTERNATIVE_PROPOSED') ?? [],
  );
}
