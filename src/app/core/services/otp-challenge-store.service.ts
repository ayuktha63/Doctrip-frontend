import { Injectable, signal } from '@angular/core';
import { OtpPurpose } from '../models/auth.model';

export interface PendingOtpChallenge {
  patientId: string;
  purpose: OtpPurpose;
  /** Where the code was sent — shown as "We sent a 6-digit code to {{ target }}" (mirrors the mockup's otpTarget). */
  target: string;
}

/**
 * Bridges AuthPageComponent -> OtpPageComponent without putting patientId/target in the URL —
 * mirrors the reference mockup keeping this in component state (`otpVia`, `reg`, `loginId`)
 * rather than routing to a param-carrying URL.
 */
@Injectable({ providedIn: 'root' })
export class OtpChallengeStore {
  private readonly _pending = signal<PendingOtpChallenge | null>(null);
  readonly pending = this._pending.asReadonly();

  set(challenge: PendingOtpChallenge): void {
    this._pending.set(challenge);
  }

  clear(): void {
    this._pending.set(null);
  }
}
