import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import {
  DiscoveryContext,
  compactDiscoveryContext,
  isDiscoveryContextEmpty,
  readDiscoveryContext,
} from '../../../core/auth/discovery-context.model';

/**
 * Redirect target for FE-WEB-2.9 (Book Appointment Authentication
 * Handoff) — story_2.md AC-9: "when they select Book Appointment, then
 * the system shall redirect the user to Login/Sign Up."
 *
 * FE-WEB-2.10 — Continue Booking After Authentication: this route reads
 * the `returnUrl` query param set by BookingHandoffService and, once
 * authentication succeeds, continues the visitor there (AC-10). It also
 * handles authentication failure (stay put, do not continue) and
 * cancellation (leave without authenticating or continuing to the
 * booking destination) per the story's edge cases.
 *
 * FE-WEB-2.11 — Preserve Discovery Context During Authentication: this
 * route also reads whichever discovery context (treatment package,
 * hospital, department, doctor) BookingHandoffService attached to the
 * redirect, and re-attaches it to the continuation URL after a
 * successful sign-in (AC-11), so the visitor is not asked to re-select.
 * If there is no returnUrl to continue to, any context present cannot
 * be attributed to a destination and is dropped rather than fabricated
 * — this is the "context cannot be retained" edge case from story_2.md.
 *
 * UNDEFINED / not yet implemented: no real login/signup UI, credential
 * check, or authentication API exists yet (docs/story_2.md
 * Dependencies: "Patient Authentication" is a separate story). Nor is
 * there yet a real booking journey to receive the restored context —
 * whether the selected record (e.g. the treatment package) is still
 * available by the time booking actually starts is re-checked by the
 * discovery detail view the visitor came from and, later, by the
 * booking journey itself; this route has no way to verify that itself.
 * The "Simulate sign-in" / "Simulate failure" / "Cancel" controls below
 * are placeholders standing in for that future form — they call
 * AuthService.signIn() (itself a placeholder mutator, not a real auth
 * call) or simply navigate away, so this route has something concrete
 * to react to until the real experience is built.
 */
@Component({
  selector: 'app-login-placeholder',
  imports: [],
  templateUrl: './login-placeholder.html',
  styleUrl: './login-placeholder.scss',
})
export class LoginPlaceholder {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  private readonly failed = signal(false);

  readonly returnUrl = computed(() => this.route.snapshot.queryParamMap.get('returnUrl'));
  readonly discoveryContext = computed<DiscoveryContext>(() =>
    readDiscoveryContext(this.route.snapshot.queryParamMap),
  );
  readonly hasFailed = this.failed.asReadonly();

  // AC-10/AC-11: continue into the booking journey after successful
  // authentication, using the preserved returnUrl and re-attaching any
  // preserved discovery context. Falls back to discovery (treatments)
  // if no returnUrl was carried — e.g. the visitor navigated to /login
  // directly rather than via a booking action; in that case any context
  // present has nowhere to go and is dropped (cannot be retained).
  simulateSuccessfulSignIn(): void {
    this.failed.set(false);
    this.authService.signIn();

    const destination = this.returnUrl();
    if (destination) {
      this.router.navigateByUrl(this.withContext(destination, this.discoveryContext()));
    } else {
      this.router.navigate(['/treatments']);
    }
  }

  // Authentication failure must not continue to the booking
  // destination: the visitor stays on this route and sees feedback, and
  // AuthService is left unauthenticated.
  simulateAuthenticationFailure(): void {
    this.failed.set(true);
  }

  // Cancelling login/signup must not authenticate the visitor or
  // continue toward the booking destination — it returns them to public
  // discovery instead, and any preserved context is discarded with it.
  cancel(): void {
    this.failed.set(false);
    this.router.navigate(['/treatments']);
  }

  private withContext(destination: string, context: DiscoveryContext): string {
    if (isDiscoveryContextEmpty(context)) {
      return destination;
    }
    const queryString = new URLSearchParams(compactDiscoveryContext(context)).toString();
    return `${destination}?${queryString}`;
  }
}
