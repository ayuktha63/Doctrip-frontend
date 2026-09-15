import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { TreatmentsService } from '../treatments.service';
import { TreatmentPackage, isPubliclyVisible } from '../treatment-package.model';
import { BookingHandoffService } from '../../../core/auth/booking-handoff.service';

type LoadState = 'loading' | 'loaded' | 'unavailable' | 'error';

/**
 * FE-WEB-2.2 — Treatment Package Details.
 * FE-WEB-2.9 — Book Appointment Authentication Handoff (for the Book /
 * Proceed to Booking action exposed here).
 * FE-WEB-2.12 — re-verifies the package is still approved/available at
 * the moment Book / Proceed to Booking is selected, covering
 * story_2.md's "Selected discovery record becomes unavailable before
 * booking starts" edge case (the initial page load alone cannot catch a
 * record that changes status while the visitor is still reading it).
 *
 * Scope boundary: this component displays approved package details and
 * exposes a Book / Proceed to Booking affordance that checks
 * authentication via BookingHandoffService, passing the selected
 * treatment package id as discovery context (FE-WEB-2.11) so it can be
 * restored after authentication. It does not implement the booking
 * journey itself or the login/signup UI.
 */
@Component({
  selector: 'app-treatment-detail',
  imports: [],
  templateUrl: './treatment-detail.html',
  styleUrl: './treatment-detail.scss',
})
export class TreatmentDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly bookingHandoff = inject(BookingHandoffService);
  private readonly treatmentsService = inject(TreatmentsService);

  private readonly state = signal<LoadState>('loading');
  private readonly pkg = signal<TreatmentPackage | null>(null);
  private readonly errorMessage = signal<string | null>(null);
  private readonly verifyingBooking = signal(false);

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasError = computed(() => this.state() === 'error');
  readonly isUnavailable = computed(() => this.state() === 'unavailable');
  readonly isLoaded = computed(() => this.state() === 'loaded');
  readonly isVerifyingBooking = this.verifyingBooking.asReadonly();

  readonly package = this.pkg.asReadonly();
  readonly currentError = this.errorMessage.asReadonly();

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('unavailable');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set(null);

    this.treatmentsService.getTreatmentPackageById(id).subscribe({
      next: (result) => {
        this.pkg.set(result);
        // Business rule (story_2.md): only approved/published records are
        // shown; an inactive record follows the same visibility rule as
        // "unavailable" from the visitor's perspective.
        this.state.set(isPubliclyVisible(result) ? 'loaded' : 'unavailable');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.state.set('error');
      },
    });
  }

  // story_2.md: "select Book / Proceed to Booking" (AC-8/AC-9). Before
  // handing off, the package is re-fetched to check it is still
  // approved/available (FE-WEB-2.12 — "Selected discovery record
  // becomes unavailable before booking starts"): the copy already on
  // screen could be stale if the record changed status while the
  // visitor was reading it. Only once that check passes is the
  // authentication check and redirect-to-login/proceed-to-booking
  // decision delegated to BookingHandoffService (FE-WEB-2.9), along with
  // the selected treatment package as discovery context (AC-11).
  proceedToBooking(): void {
    const current = this.pkg();
    if (!current) {
      return;
    }

    this.verifyingBooking.set(true);

    this.treatmentsService.getTreatmentPackageById(String(current.id)).subscribe({
      next: (result) => {
        this.verifyingBooking.set(false);
        this.pkg.set(result);

        if (!isPubliclyVisible(result)) {
          this.state.set('unavailable');
          return;
        }

        this.bookingHandoff.proceed(['/booking', 'treatment', String(result.id)], {
          treatmentPackageId: String(result.id),
        });
      },
      error: (err: Error) => {
        // Verification failed (e.g. backend unavailable) — do not
        // proceed to booking with stale, unverified data.
        this.verifyingBooking.set(false);
        this.errorMessage.set(err.message);
        this.state.set('error');
      },
    });
  }
}
