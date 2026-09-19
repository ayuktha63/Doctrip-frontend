import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AppointmentsStateService } from '../../../core/services/appointments-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ToastHostComponent } from '../toast-host/toast-host.component';

/**
 * The persistent header from the reference mockup (PatientPanel.dc.html's top `<header>`), which
 * wraps every screen including sign-in/sign-up — not just the authenticated app. "Discover"
 * routes to Story 2's treatment discovery, "My appointments" / the notification bell route to the
 * appointments management screens, and both the "Account" nav item and clicking the user's own
 * details (top-right) route to /account.
 */
@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent, ConfirmDialogComponent],
  templateUrl: './app-shell.component.html',
})
export class AppShellComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  protected readonly appointmentsState = inject(AppointmentsStateService);

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

  private readonly url = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map((e) => e.urlAfterRedirects),
      startWith(this.router.url),
    ),
    { initialValue: this.router.url },
  );
  protected readonly onAppointments = computed(
    () => this.url()!.startsWith('/appointments') || this.url()!.startsWith('/notifications'),
  );

  goHome(): void {
    this.router.navigate(['/home']);
  }

  goSignIn(): void {
    this.router.navigate(['/auth']);
  }

  goDiscover(): void {
    this.router.navigate(['/discover']);
  }

  goAppointments(): void {
    this.router.navigate(['/appointments']);
  }

  goNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  goAccount(): void {
    this.router.navigate(['/account']);
  }
}
