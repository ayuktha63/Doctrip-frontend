import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastHostComponent } from '../toast-host/toast-host.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';

/**
 * The DocTrip Admin console shell — mirrors the reference mockup's `Main.dc.html` artboard
 * exactly: sidebar (logo, "Admin console" label, Dashboard/Hospitals nav, admin profile chip) +
 * top header (breadcrumb). Entirely separate chrome from the patient app-shell (sidebar layout,
 * not the patient header layout) since this is a different persona's console, not a screen within
 * the patient app. No admin auth exists in this story (see backend CLAUDE.md), so the profile
 * chip is a static label rather than a real session.
 */
@Component({
  selector: 'app-admin-shell',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent, ConfirmDialogComponent],
  templateUrl: './admin-shell.component.html',
})
export class AdminShellComponent {
  private readonly router = inject(Router);

  private readonly url = signal(this.router.url);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
    });
  }

  protected readonly onDashboard = computed(() => this.url() === '/admin' || this.url() === '/admin/');
  protected readonly onHospitals = computed(() => this.url().startsWith('/admin/hospitals'));
  protected readonly onUsers = computed(() => this.url().startsWith('/admin/users'));

  protected readonly crumb = computed(() => {
    if (this.onUsers()) return 'Users';
    if (this.onHospitals()) return 'Hospitals';
    return 'Dashboard';
  });

  protected readonly adminName = computed(() => 'DocTrip Admin');
  protected readonly adminInitials = computed(() => 'DA');

  goDashboard(): void {
    this.router.navigate(['/admin']);
  }

  goHospitals(): void {
    this.router.navigate(['/admin/hospitals']);
  }

  goUsers(): void {
    this.router.navigate(['/admin/users']);
  }

  /** No real admin session exists yet (see class doc comment) — "logging out" just exits the
   *  console back to the patient app, same as there being nothing to actually clear. */
  logout(): void {
    this.router.navigate(['/']);
  }
}
