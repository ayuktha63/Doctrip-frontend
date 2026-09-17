import { Component, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

/**
 * Landing target for BookingHandoffService.proceed() when an
 * authenticated patient selects "Book appointment" (story_2.md AC-8:
 * "the system shall proceed to the booking journey").
 *
 * Story 2's own scope explicitly stops at "Navigation into booking" —
 * the booking journey itself is a separate dependency ("Booking
 * service", story_2.md Dependencies), not built here. Before this
 * route existed, `/booking/...` had no match, so Angular's wildcard
 * route silently redirected back to /home with no feedback — this
 * page exists so clicking Book appointment shows something real
 * instead of that silent bounce, matching the app-shell's existing
 * "coming soon" convention for other not-yet-built destinations.
 */
@Component({
  selector: 'app-booking-placeholder',
  imports: [],
  templateUrl: './booking-placeholder.html',
  styleUrl: './booking-placeholder.scss',
})
export class BookingPlaceholder {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  readonly kind = computed(() => this.route.snapshot.paramMap.get('kind') ?? '');
  readonly id = computed(() => this.route.snapshot.paramMap.get('id') ?? '');

  backToDiscovery(): void {
    this.router.navigate(['/discover']);
  }
}
