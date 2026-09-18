import { ParamMap } from '@angular/router';
import {
  DiscoveryContext,
  compactDiscoveryContext,
  isDiscoveryContextEmpty,
  readDiscoveryContext,
} from './discovery-context.model';

/**
 * FE-WEB-2.10 — Continue Booking After Authentication.
 * FE-WEB-2.11 — Preserve Discovery Context During Authentication.
 *
 * Shared by AuthPageComponent and OtpPageComponent (both are successful
 * sign-in endpoints — password login and OTP verify) so the "where do we
 * send the patient after signing in" decision only lives in one place.
 *
 * Reads the `returnUrl` (+ any discovery context) that
 * BookingHandoffService attached to the `/auth` redirect, and builds the
 * URL to continue to. Falls back to `/home` when there's no returnUrl —
 * e.g. the patient navigated to /auth directly, not via a booking
 * action — in which case any context present has nowhere to go and is
 * dropped rather than fabricated (story_2.md — "context cannot be
 * retained" edge case).
 */
export function continueUrlAfterAuth(queryParamMap: ParamMap): string {
  const returnUrl = queryParamMap.get('returnUrl');
  if (!returnUrl) {
    return '/home';
  }

  const context: DiscoveryContext = readDiscoveryContext(queryParamMap);
  if (isDiscoveryContextEmpty(context)) {
    return returnUrl;
  }

  const queryString = new URLSearchParams(compactDiscoveryContext(context)).toString();
  return `${returnUrl}?${queryString}`;
}
