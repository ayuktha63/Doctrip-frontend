import { Component, computed, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastHostComponent } from '../toast-host/toast-host.component';

/**
 * The persistent header from the reference mockup (PatientPanel.dc.html's top `<header>`), which
 * wraps every screen including sign-in/sign-up — not just the authenticated app. "Discover" now
 * routes to Story 2's treatment discovery. "My appointments" / "Account" and the notification bell
 * belong to later stories (booking, profile management) and aren't built yet, so they still show a
 * "coming soon" toast instead of navigating anywhere real — same convention HRMS-frontend uses for
 * out-of-scope tiles.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly isAuthenticated = this.auth.isAuthenticated;
  protected readonly initials = computed(() => {
    const name = this.auth.patient()?.fullName ?? '';
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  });
  protected readonly fullName = computed(() => this.auth.patient()?.fullName ?? '');
  protected readonly email = computed(() => this.auth.patient()?.email ?? '');

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goSignIn(): void {
    this.router.navigate(['/auth']);
  }

  goDiscover(): void {
    this.router.navigate(['/discover']);
  }

  comingSoon(): void {
    this.toast.show("That's coming in a future update.");
  }
}
