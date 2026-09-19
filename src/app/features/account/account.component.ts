import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

/**
 * Account — the reference mockup's `isAccount` screen, reached by clicking the header's user
 * details (top-right), not a nav item with its own page heading (the user's name/avatar in the
 * card below already says where they are).
 *
 * Only `fullName`/`email`/`mobile` are shown — there is no `PATCH /api/patients/me` endpoint yet
 * (only `GET`, per Doctrip-backend's CLAUDE.md), so these are read-only rather than a form that
 * silently goes nowhere. The mockup's "Account settings" toggles (notification preferences etc.)
 * aren't backed by anything real either and are left out rather than faked.
 */
@Component({
  selector: 'app-account',
  standalone: true,
  templateUrl: './account.component.html',
})
export class AccountComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly patient = this.auth.patient;
  protected readonly initials = computed(() => {
    const name = this.patient()?.fullName ?? '';
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });

  logout(): void {
    this.auth.logout().subscribe({
      next: () => this.router.navigate(['/auth']),
      error: () => this.router.navigate(['/auth']),
    });
  }
}
