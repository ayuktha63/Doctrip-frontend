import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { HospitalAdminContextService } from '../../../core/services/hospital-admin-context.service';
import { ToastHostComponent } from '../toast-host/toast-host.component';

/**
 * Hospital Admin's "coordination desk" console shell — reproduces the reference mockup's
 * `HospitalAdmin.dc.html` artboard sidebar/header field-for-field. This is a distinct persona from
 * DocTrip Admin's platform-wide `AdminShellComponent` (Story 3) — a Hospital Admin only ever sees
 * their own hospital's coordination, not the platform's hospital master records.
 *
 * Per the Hospital Appointment Coordination story, only the "Requests" tab is functionally built —
 * Dashboard/Hospital/Departments/Doctors/Availability are real nav items (matching the mockup's
 * sidebar) but route to a placeholder screen; their data isn't built yet (no Department/Doctor
 * master data, no availability, in this backend at all — see Doctrip-backend's CLAUDE.md
 * non-goals). Don't wire them up as a side effect of other work without their own story.
 */
@Component({
  selector: 'app-hospital-admin-shell',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent],
  templateUrl: './hospital-admin-shell.component.html',
})
export class HospitalAdminShellComponent implements OnInit {
  private readonly router = inject(Router);
  protected readonly context = inject(HospitalAdminContextService);

  private readonly url = signal(this.router.url);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
    });
  }

  ngOnInit(): void {
    this.context.ensureLoaded();
  }

  protected readonly navItems = [
    { key: 'dashboard', label: 'Dashboard', path: '/hospital-admin/dashboard' },
    { key: 'hospital', label: 'Hospital', path: '/hospital-admin/hospital' },
    { key: 'departments', label: 'Departments', path: '/hospital-admin/departments' },
    { key: 'doctors', label: 'Doctors', path: '/hospital-admin/doctors' },
    { key: 'availability', label: 'Availability', path: '/hospital-admin/availability' },
    { key: 'requests', label: 'Requests', path: '/hospital-admin/requests' },
  ] as const;

  protected isActive(path: string): boolean {
    return this.url() === path || this.url().startsWith(`${path}/`);
  }

  protected readonly crumb = computed(() => {
    const current = this.navItems.find((n) => this.isActive(n.path));
    return current?.label ?? 'Coordination desk';
  });

  go(path: string): void {
    this.router.navigateByUrl(path);
  }
}
