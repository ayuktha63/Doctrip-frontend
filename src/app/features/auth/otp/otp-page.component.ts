import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OtpChallengeStore } from '../../../core/services/otp-challenge-store.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/auth.model';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * OTP verification screen — mirrors the reference mockup's `isOtp` block in PatientPanel.dc.html
 * (6-box code entry, resend countdown), wired to real backend verify/resend calls instead of the
 * mockup's "any six digits verify" placeholder logic.
 */
@Component({
  selector: 'app-otp-page',
  standalone: true,
  templateUrl: './otp-page.component.html',
})
export class OtpPageComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly otpChallengeStore = inject(OtpChallengeStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  private tick: ReturnType<typeof setInterval> | null = null;

  protected readonly challenge = this.otpChallengeStore.pending;
  protected readonly otp = signal('');
  protected readonly otpError = signal('');
  protected readonly submitting = signal(false);
  protected readonly resendSeconds = signal(RESEND_COOLDOWN_SECONDS);

  protected readonly title = computed(() =>
    this.challenge()?.purpose === 'LOGIN' ? 'Enter your login code' : 'Verify your account',
  );
  protected readonly resendLabel = computed(() =>
    this.resendSeconds() > 0 ? `Resend code in ${this.resendSeconds()}s` : "Didn't get it? Resend code",
  );
  protected readonly boxes = computed(() => {
    const value = this.otp();
    return [0, 1, 2, 3, 4, 5].map((i) => ({
      ch: value[i] ?? '',
      bg: value[i] ? '#F0F6FF' : '#fff',
      border: value.length === i ? '#1A6DF0' : value[i] ? '#A9C2F0' : '#E3E9F2',
    }));
  });

  ngOnInit(): void {
    if (!this.challenge()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.tick = setInterval(() => {
      this.resendSeconds.update((s) => Math.max(s - 1, 0));
    }, 1000);
  }

  ngOnDestroy(): void {
    if (this.tick) clearInterval(this.tick);
  }

  onOtpInput(event: Event): void {
    const raw = (event.target as HTMLInputElement).value;
    this.otp.set(raw.replace(/\D/g, '').slice(0, 6));
    this.otpError.set('');
  }

  backToAuth(): void {
    this.otpChallengeStore.clear();
    this.router.navigate(['/auth']);
  }

  submitOtp(): void {
    const challenge = this.challenge();
    if (!challenge) return;
    if (!/^\d{6}$/.test(this.otp())) {
      this.otpError.set('Enter the 6-digit code we sent you.');
      return;
    }
    this.submitting.set(true);
    this.auth.verifyOtp({ patientId: challenge.patientId, purpose: challenge.purpose, otp: this.otp() }).subscribe({
      next: () => {
        this.submitting.set(false);
        const isSignUp = challenge.purpose === 'REGISTER';
        this.otpChallengeStore.clear();
        this.toast.show(isSignUp ? 'Account created. Welcome to DocTrip.' : 'Signed in.');
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.otpError.set(this.errorMessage(err, 'Enter the 6-digit code we sent you.'));
      },
    });
  }

  resend(): void {
    const challenge = this.challenge();
    if (!challenge || this.resendSeconds() > 0) return;
    this.auth.resendOtp({ patientId: challenge.patientId, purpose: challenge.purpose }).subscribe({
      next: () => {
        this.resendSeconds.set(RESEND_COOLDOWN_SECONDS);
        this.toast.show('A new code is on its way.');
      },
      error: (err: HttpErrorResponse) => {
        this.otpError.set(this.errorMessage(err, 'Please wait before requesting another code.'));
      },
    });
  }

  private errorMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error as ApiError | undefined;
    return body?.message || fallback;
  }
}
