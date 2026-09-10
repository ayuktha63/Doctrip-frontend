import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/services/auth.service';
import { OtpChallengeStore } from '../../core/services/otp-challenge-store.service';
import { ApiError } from '../../core/models/auth.model';
import { mobileNumberValidator, passwordStrengthScore, strongPasswordValidator } from '../../shared/validators';

type AuthTab = 'signin' | 'signup';

/**
 * Sign in / sign up screen — mirrors the reference mockup's `isAuth` block in PatientPanel.dc.html
 * exactly (layout, copy, colors), with two differences: real backend calls instead of mock state,
 * and no "Continue as guest" button (guest login is being removed from the product).
 */
@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './auth-page.component.html',
})
export class AuthPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly otpChallengeStore = inject(OtpChallengeStore);
  private readonly router = inject(Router);

  protected readonly tab = signal<AuthTab>('signin');
  protected readonly submitting = signal(false);
  protected readonly loginError = signal('');
  protected readonly loginShowPassword = signal(false);
  protected readonly registerServerError = signal('');

  protected readonly loginForm = this.fb.nonNullable.group({
    loginId: ['', Validators.required],
    password: ['', Validators.required],
  });

  protected readonly registerForm = this.fb.nonNullable.group({
    fullName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    mobile: ['', [Validators.required, mobileNumberValidator]],
    password: ['', [Validators.required, strongPasswordValidator]],
    agree: [false, Validators.requiredTrue],
  });

  protected readonly googleAuthUrl = `${environment.apiBaseUrl}/oauth2/authorization/google`;
  protected readonly appleAuthUrl = `${environment.apiBaseUrl}/oauth2/authorization/apple`;

  pickTab(tab: AuthTab): void {
    this.tab.set(tab);
    this.loginError.set('');
  }

  toggleLoginPasswordVisibility(): void {
    this.loginShowPassword.update((v) => !v);
  }

  passwordStrength(): { pct: string; color: string; label: string } {
    const score = passwordStrengthScore(this.registerForm.controls.password.value);
    const colors = ['#E3E9F2', '#DC2626', '#FFB020', '#16A34A'];
    const labels = [
      'Use 8+ characters with upper/lowercase, a number and a symbol',
      'Weak',
      'Fair',
      'Strong',
    ];
    return { pct: `${score * 33.4}%`, color: colors[score], label: labels[score] };
  }

  toggleAgree(): void {
    const control = this.registerForm.controls.agree;
    control.setValue(!control.value);
  }

  submitLogin(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.loginError.set('Email or password is incorrect.');
      return;
    }
    this.loginError.set('');
    this.submitting.set(true);
    this.auth.login(this.loginForm.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/home']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.loginError.set(this.errorMessage(err, 'Email or password is incorrect.'));
      },
    });
  }

  goOtpLogin(): void {
    const loginId = this.loginForm.controls.loginId.value.trim();
    if (!loginId) {
      this.loginError.set('Enter your email or mobile to get a code.');
      return;
    }
    this.loginError.set('');
    this.submitting.set(true);
    this.auth.requestLoginOtp({ loginId }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.otpChallengeStore.set({ patientId: res.patientId, purpose: 'LOGIN', target: res.otpTarget });
        this.router.navigate(['/auth/otp']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.loginError.set(this.errorMessage(err, 'We could not find an account for that email or mobile.'));
      },
    });
  }

  submitRegister(): void {
    this.registerServerError.set('');
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { fullName, email, mobile, password, agree } = this.registerForm.getRawValue();
    this.auth.register({ fullName, email, mobile, password, agreeToTerms: agree }).subscribe({
      next: (res) => {
        this.submitting.set(false);
        this.otpChallengeStore.set({ patientId: res.patientId, purpose: 'REGISTER', target: res.otpTarget });
        this.router.navigate(['/auth/otp']);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        this.registerServerError.set(this.errorMessage(err, 'Registration failed. Please try again.'));
      },
    });
  }

  continueWithGoogle(): void {
    window.location.href = this.googleAuthUrl;
  }

  continueWithApple(): void {
    window.location.href = this.appleAuthUrl;
  }

  private errorMessage(err: HttpErrorResponse, fallback: string): string {
    const body = err.error as ApiError | undefined;
    return body?.message || fallback;
  }
}
