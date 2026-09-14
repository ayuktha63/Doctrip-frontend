import { Injectable, signal } from '@angular/core';

/**
 * Frontend authentication boundary.
 *
 * UNDEFINED / not yet implemented:
 * - No auth API contract exists (login/signup endpoints, token format,
 *   session/refresh mechanism) — see docs/story_2.md Dependencies:
 *   "Patient Authentication".
 * - No token storage or session-restoration strategy is decided.
 * - No login/signup UI or session-restoration flow exists yet; a
 *   placeholder redirect target was added for FE-WEB-2.9 (see
 *   features/auth/login-placeholder), but the real experience belongs
 *   to the Patient Authentication story.
 *
 * This service exists only so discovery-facing code has a single,
 * stable boundary to depend on (isAuthenticated) instead of reaching
 * into undefined backend details directly. Its current implementation
 * is a placeholder that always reports "unauthenticated" — consumed by
 * BookingHandoffService (FE-WEB-2.9) to decide whether Book / Proceed to
 * Booking continues into the booking journey or redirects to Login/Sign
 * Up.
 *
 * `signIn()` is a placeholder mutator, not a real authentication call —
 * there is no credential check, token, or backend request behind it. It
 * exists so FE-WEB-2.10 (Continue Booking After Authentication) has
 * something to react to; the login-placeholder route calls it to
 * simulate a successful sign-in until the Patient Authentication story
 * replaces it with the real flow.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly authenticated = signal(false);

  readonly isAuthenticated = this.authenticated.asReadonly();

  signIn(): void {
    this.authenticated.set(true);
  }
}
