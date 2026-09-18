import { Component, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalAdminAuthService } from '../../../core/services/hospital-admin-auth.service';
import { ApiError } from '../../../core/models/auth.model';

/**
 * Ports HospitalAdmin.dc.html's `isLogin` screen (~lines 920-999). The mockup's field is a
 * generic "Username" (`user`/`pw`) because in the mock it's an account DocTrip issues per
 * hospital desk — but the real backend endpoint (`POST /api/hospital-admin/auth/login`) takes
 * `{ email, password }`, so this uses a proper email input, matching CLAUDE.md's established
 * precedent of diverging from the mockup's copy where it doesn't match the real contract.
 */
@Component({
  selector: 'app-hospital-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hospital-admin-login.component.html',
})
export class HospitalAdminLoginComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(HospitalAdminAuthService);
  private readonly router = inject(Router);

  protected readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required],
  });

  protected readonly submitting = signal(false);
  protected readonly authErr = signal('');
  protected readonly pwShown = signal(false);

  togglePw(): void {
    this.pwShown.set(!this.pwShown());
  }

  forgot(): void {
    // Not in scope for Story 4 — no-op, mirrors the mockup's "Forgot password?" link with no
    // backend flow behind it yet.
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.authErr.set('');
    this.submitting.set(true);
    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.router.navigate(['/hospital-admin']);
      },
      error: (err: { error?: ApiError }) => {
        this.submitting.set(false);
        this.authErr.set(err.error?.message ?? 'Invalid email or password.');
      },
    });
  }
}
