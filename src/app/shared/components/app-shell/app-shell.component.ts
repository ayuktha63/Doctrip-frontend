import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter, map, startWith } from 'rxjs';
import { AppointmentsStateService } from '../../../core/services/appointments-state.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { ToastHostComponent } from '../toast-host/toast-host.component';

/**
 * The persistent header from the reference mockup (PatientPanel.dc.html's top `<header>`), which
 * wraps every screen including sign-in/sign-up — not just the authenticated app. "My appointments"
 * and the notification bell route to their real screens (this branch ships appointments
 * management only, no Discover/booking); "Discover" and "Account" still have no screen built here,
 * so they keep the "coming soon" toast.
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
  private readonly toast = inject(ToastService);
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

  goAppointments(): void {
    this.router.navigate(['/appointments']);
  }

  goNotifications(): void {
    this.router.navigate(['/notifications']);
  }

  comingSoon(): void {
    this.toast.show("That's coming in a future update.");
  }
}
