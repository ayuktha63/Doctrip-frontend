import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { OtpChallengeStore } from '../../../core/services/otp-challenge-store.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/auth.model';
import { continueUrlAfterAuth } from '../../../core/auth/continue-after-auth';
import { TranslationService } from '../../../core/services/translation.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

const RESEND_COOLDOWN_SECONDS = 30;

/**
 * OTP verification screen — mirrors the reference mockup's `isOtp` block in PatientPanel.dc.html
 * (6-box code entry, resend countdown, Back link), wired to real backend verify/resend calls
 * instead of the mockup's "any six digits verify" placeholder logic.
 *
 * The browser's own Back/Forward buttons are blocked while this screen is active (the patient
 * must use the in-app "Back" link or complete verification instead) via a history-API trap: a
 * dummy history entry is pushed on entry, and any popstate this screen sees while alive just gets
 * pushed right back — this only intercepts actual browser back/forward, not Angular Router
 * navigation from clicking a link, so the mockup's own "Back" button keeps working normally.
 */
@Component({
  selector: 'app-otp-page',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './otp-page.component.html',
})
export class OtpPageComponent implements OnInit, OnDestroy {
  private readonly auth = inject(AuthService);
  private readonly otpChallengeStore = inject(OtpChallengeStore);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly translation = inject(TranslationService);

  private tick: ReturnType<typeof setInterval> | null = null;

  protected readonly challenge = this.otpChallengeStore.pending;
  protected readonly otp = signal('');
  protected readonly otpError = signal('');
  protected readonly submitting = signal(false);
  protected readonly resendSeconds = signal(RESEND_COOLDOWN_SECONDS);

  protected readonly title = computed(() =>
    this.translation.translate(this.challenge()?.purpose === 'LOGIN' ? 'otp.titleLogin' : 'otp.titleVerify'),
  );
  protected readonly resendLabel = computed(() =>
    this.resendSeconds() > 0
      ? this.translation.translate('otp.resendIn').replace('{seconds}', String(this.resendSeconds()))
      : this.translation.translate('otp.resendNow'),
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

    // Trap browser Back/Forward: push a dummy entry now, then re-push it on every popstate seen
    // while this screen is alive, so the URL never actually changes from a back/forward press.
    // In-app navigation (e.g. clicking the "Back" link below) uses pushState via the Router, not
    // popstate, so it's untouched by this and keeps working normally.
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', this.blockPopState);
  }

  ngOnDestroy(): void {
    if (this.tick) clearInterval(this.tick);
    window.removeEventListener('popstate', this.blockPopState);
  }

  private blockPopState = (): void => {
    history.pushState(null, '', location.href);
  };

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
      this.otpError.set(this.translation.translate('otp.errorInvalid'));
      return;
    }
    this.submitting.set(true);
    this.auth.verifyOtp({ patientId: challenge.patientId, purpose: challenge.purpose, otp: this.otp() }).subscribe({
      next: () => {
        this.submitting.set(false);
        const isSignUp = challenge.purpose === 'REGISTER';
        this.otpChallengeStore.clear();
        this.toast.show(this.translation.translate(isSignUp ? 'otp.toastAccountCreated' : 'otp.toastSignedIn'));
        // FE-WEB-2.10/2.11: continue to the booking destination (with
        // discovery context) if this sign-in was reached via a Book
        // action redirect; otherwise the usual /home.
        this.router.navigateByUrl(continueUrlAfterAuth(this.route.snapshot.queryParamMap));
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.otpError.set(this.errorMessage(err, this.translation.translate('otp.errorInvalid')));
      },
    });
  }

  resend(): void {
    const challenge = this.challenge();
    if (!challenge || this.resendSeconds() > 0) return;
    this.auth.resendOtp({ patientId: challenge.patientId, purpose: challenge.purpose }).subscribe({
      next: () => {
        this.resendSeconds.set(RESEND_COOLDOWN_SECONDS);
        this.toast.show(this.translation.translate('otp.toastResent'));
      },
      error: (err: HttpErrorResponse) => {
        this.otpError.set(this.errorMessage(err, this.translation.translate('otp.errorWait')));
      },
    });
  }

  private errorMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error as ApiError | undefined;
    return body?.message || fallback;
  }
}
