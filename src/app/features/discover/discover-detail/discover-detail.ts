import { Component, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TreatmentsService } from '../../treatments/treatments.service';
import { HospitalsService } from '../../hospitals/hospitals.service';
import { DoctorsService } from '../../doctors/doctors.service';
import { BookingHandoffService } from '../../../core/auth/booking-handoff.service';
import { DiscoveryContext } from '../../../core/auth/discovery-context.model';
import {
  DiscoverKind,
  DiscoverRecord,
  KIND_CONFIG,
  kindByUrlSegment,
  subFor,
  metaFor,
  factsFor,
  teamFor,
  initialsFromName,
  formatExperience,
} from '../discover.types';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type LoadState = 'loading' | 'loaded' | 'unavailable' | 'error';

/**
 * Story 2 — Healthcare Discovery (unified detail screen), covering
 * FE-WEB-2.2/2.5/2.8 (treatment/hospital/doctor details) plus
 * FE-WEB-2.9/2.11/2.12 (Book appointment auth handoff, discovery-context
 * retention, re-verify-before-booking) — uniformly, for whichever kind
 * of record was opened.
 *
 * Visual/structural reference: docs/"doctrip-web-panels 2.html"
 * (PatientPanel.dc.html) — its "Detail" screen is the SAME template for
 * treatments, hospitals and doctors: title, subtitle, "About" card with
 * a facts grid, a "Departments and consultants" team list, and a
 * sidebar with an indicative meta value + "Book appointment".
 *
 * Data boundary: every field rendered here (subtitle, facts, team,
 * sidebar meta) comes from the confirmed backend contract — verified
 * live against the running API (see treatment-package.model.ts /
 * hospital.model.ts / doctor.model.ts) — nothing is fabricated.
 */
@Component({
  selector: 'app-discover-detail',
  imports: [TranslatePipe],
  templateUrl: './discover-detail.html',
  styleUrl: './discover-detail.scss',
})
export class DiscoverDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly hospitalsService = inject(HospitalsService);
  private readonly doctorsService = inject(DoctorsService);
  private readonly bookingHandoff = inject(BookingHandoffService);

  private readonly state = signal<LoadState>('loading');
  private readonly record = signal<DiscoverRecord | null>(null);
  private readonly errorMessage = signal<string | null>(null);
  private readonly verifyingBooking = signal(false);

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasError = computed(() => this.state() === 'error');
  readonly isUnavailable = computed(() => this.state() === 'unavailable');
  readonly isLoaded = computed(() => this.state() === 'loaded');
  readonly isVerifyingBooking = this.verifyingBooking.asReadonly();

  readonly item = this.record.asReadonly();
  readonly currentError = this.errorMessage.asReadonly();

  private readonly kind = signal<DiscoverKind | null>(null);

  readonly subtitle = computed(() => {
    const kind = this.kind();
    const record = this.item();
    return kind && record ? subFor(kind, record) : undefined;
  });

  readonly meta = computed(() => {
    const kind = this.kind();
    const record = this.item();
    return kind && record ? metaFor(kind, record) : undefined;
  });

  readonly facts = computed(() => {
    const kind = this.kind();
    const record = this.item();
    return kind && record ? factsFor(kind, record) : [];
  });

  readonly team = computed(() => {
    const record = this.item();
    return record ? teamFor(record) : [];
  });

  constructor() {
    this.load();
  }

  load(): void {
    const type = this.route.snapshot.paramMap.get('type');
    const id = this.route.snapshot.paramMap.get('id');
    const kind = type ? kindByUrlSegment(type) : undefined;

    if (!kind || !id) {
      this.state.set('unavailable');
      return;
    }
    this.kind.set(kind);

    this.state.set('loading');
    this.errorMessage.set(null);

    this.fetchById(kind, id).subscribe({
      next: (result) => {
        this.record.set(result);
        this.state.set('loaded');
      },
      error: (err: HttpErrorResponse) => this.handleLoadError(err),
    });
  }

  teamInitials(name: string): string {
    return initialsFromName(name);
  }

  readonly formatExperience = formatExperience;

  backToDiscovery(): void {
    const kind = this.kind();
    this.router.navigate(['/discover'], kind ? { queryParams: { tab: kind } } : undefined);
  }

  // story_2.md: "select Book / Proceed to Booking" (AC-8/AC-9). Before
  // handing off, the record is re-fetched to check it is still
  // available (FE-WEB-2.12 — "Selected discovery record becomes
  // unavailable before booking starts").
  proceedToBooking(): void {
    const kind = this.kind();
    const current = this.item();
    if (!kind || !current) {
      return;
    }

    this.verifyingBooking.set(true);

    this.fetchById(kind, String(current.id)).subscribe({
      next: (result) => {
        this.verifyingBooking.set(false);
        this.record.set(result);
        const config = KIND_CONFIG[kind];
        this.bookingHandoff.proceed(
          ['/booking', config.bookingSegment, String(result.id)],
          this.contextFor(kind, String(result.id)),
        );
      },
      error: (err: HttpErrorResponse) => {
        this.verifyingBooking.set(false);
        if (err.status === 404) {
          this.state.set('unavailable');
          return;
        }
        this.errorMessage.set(err.error?.message ?? err.message);
        this.state.set('error');
      },
    });
  }

  private fetchById(kind: DiscoverKind, id: string): Observable<DiscoverRecord> {
    switch (kind) {
      case 'Treatments':
        return this.treatmentsService.getTreatmentPackageById(id);
      case 'Hospitals':
        return this.hospitalsService.getHospitalById(id);
      case 'Doctors':
        return this.doctorsService.getDoctorById(id);
    }
  }

  private contextFor(kind: DiscoverKind, id: string): DiscoveryContext {
    switch (kind) {
      case 'Treatments':
        return { treatmentPackageId: id };
      case 'Hospitals':
        return { hospitalId: id };
      case 'Doctors':
        return { doctorId: id };
    }
  }

  private handleLoadError(err: HttpErrorResponse): void {
    // Confirmed contract: an unknown id returns a 404 JSON error —
    // that's "record not found/unavailable" (story_2.md edge case), not
    // a generic backend failure.
    if (err.status === 404) {
      this.state.set('unavailable');
      return;
    }
    this.errorMessage.set(err.error?.message ?? err.message);
    this.state.set('error');
  }
}
