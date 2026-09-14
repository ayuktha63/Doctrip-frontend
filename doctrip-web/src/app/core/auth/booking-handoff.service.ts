import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { DiscoveryContext, compactDiscoveryContext } from './discovery-context.model';

/**
 * FE-WEB-2.9 — Book Appointment Authentication Handoff.
 * FE-WEB-2.10 — Continue Booking After Authentication (return-URL
 * preservation on redirect).
 * FE-WEB-2.11 — Preserve Discovery Context During Authentication
 * (treatment package / hospital / department / doctor selection).
 *
 * Centralizes the authentication check performed whenever a visitor
 * selects a Book / Proceed to Booking action from discovery (story_2.md
 * — "Booking Entry": "Selecting Book Appointment or an equivalent
 * booking action shall check authentication status."). Any discovery
 * detail view with a booking affordance (currently: treatment package
 * details) should route its action through this service instead of
 * navigating directly, so the authenticated-vs-unauthenticated decision
 * stays in one place.
 *
 * - Authenticated: proceeds to the given booking destination directly;
 *   no context needs to be carried through a redirect.
 * - Unauthenticated: redirects to Login/Sign Up (story_2.md AC-9),
 *   carrying the intended booking destination as a `returnUrl` query
 *   param (AC-10) plus whichever discovery context was selected (AC-11)
 *   — only the fields actually provided are included, since story_2.md
 *   says context is retained "where applicable", not fabricated for
 *   selections that were never made.
 *
 * Scope boundary: this only decides where to navigate and what to carry
 * across the handoff. It does not implement the booking journey itself
 * or the login/signup flow. If the selected record becomes unavailable
 * before booking starts (story_2.md edge case), that can only be
 * detected by re-checking the record itself — which belongs to the
 * booking journey (not yet implemented) or the discovery detail view
 * the visitor came from (which already re-fetches and shows the
 * unavailable state on load, per FE-WEB-2.2/2.5/2.8). No real
 * authentication API is invoked here; it defers entirely to the
 * existing AuthService boundary (itself a placeholder per docs/story_2.md
 * Dependencies: "Patient Authentication").
 */
@Injectable({ providedIn: 'root' })
export class BookingHandoffService {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  proceed(bookingCommands: readonly string[], context: DiscoveryContext = {}): void {
    if (this.authService.isAuthenticated()) {
      this.router.navigate(bookingCommands as string[]);
    } else {
      this.router.navigate(['/login'], {
        queryParams: {
          returnUrl: this.toReturnUrl(bookingCommands),
          ...compactDiscoveryContext(context),
        },
      });
    }
  }

  private toReturnUrl(bookingCommands: readonly string[]): string {
    return bookingCommands.join('/');
  }
}
