import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { filter } from 'rxjs';
import { ToastHostComponent } from '../toast-host/toast-host.component';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog.component';
import { HospitalAdminAuthService } from '../../../core/services/hospital-admin-auth.service';
import { HospitalAdminDashboardService } from '../../../core/services/hospital-admin-dashboard.service';

/**
 * Hospital Admin console shell — ports the mockup's `.dt-side` sidebar (HospitalAdmin.dc.html,
 * ~lines 1002-1071): Overview (Dashboard, Hospital), Clinical setup (Departments, Treatments,
 * Doctors, Availability), Coordination (Requests). Entirely separate route tree and chrome from
 * both the patient AppShellComponent and the Story 3 AdminShellComponent — this is a third,
 * distinct persona with its own login (see hospital-admin-auth.guard.ts).
 *
 * Supersedes an earlier version of this same file from the Hospital Appointment Coordination
 * story (DT-6, merged into develop first), which had no Hospital-Admin login yet and left every
 * tab but Requests as a placeholder — that story's own code comment said to "replace with a real
 * session-derived hospitalId once Hospital Admin auth exists." This is that auth. Requests now
 * routes to DT-6's real RequestListComponent/RequestDetailComponent, behind this real guard,
 * instead of its previous no-auth placeholder — see app.routes.ts.
 */
@Component({
  selector: 'app-hospital-admin-shell',
  standalone: true,
  imports: [RouterOutlet, ToastHostComponent, ConfirmDialogComponent],
  templateUrl: './hospital-admin-shell.component.html',
})
export class HospitalAdminShellComponent {
  private readonly router = inject(Router);
  protected readonly auth = inject(HospitalAdminAuthService);
  protected readonly dashboard = inject(HospitalAdminDashboardService);

  private readonly url = signal(this.router.url);

  constructor() {
    this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((e) => {
      this.url.set((e as NavigationEnd).urlAfterRedirects);
    });
  }

  protected readonly onDashboard = computed(() => this.isOn('/hospital-admin', true));
  protected readonly onHospital = computed(() => this.isOn('/hospital-admin/hospital'));
  protected readonly onDepartments = computed(() => this.isOn('/hospital-admin/departments'));
  protected readonly onTreatments = computed(() => this.isOn('/hospital-admin/treatments'));
  protected readonly onDoctors = computed(() => this.isOn('/hospital-admin/doctors'));
  protected readonly onAvailability = computed(() => this.isOn('/hospital-admin/availability'));
  protected readonly onRequests = computed(() => this.isOn('/hospital-admin/requests'));

  protected readonly crumb = computed(() => {
    if (this.onHospital()) return 'Hospital';
    if (this.onDepartments()) return 'Departments';
    if (this.onTreatments()) return 'Treatments';
    if (this.onDoctors()) return 'Doctors';
    if (this.onAvailability()) return 'Availability';
    if (this.onRequests()) return 'Requests';
    return 'Dashboard';
  });

  protected readonly hospitalCode = computed(() => this.auth.hospitalId() ?? '');
  protected readonly hospitalName = computed(() => this.auth.hospitalName() ?? 'Your hospital');

  private isOn(prefix: string, exact = false): boolean {
    const u = this.url();
    return exact ? u === prefix || u === `${prefix}/` : u.startsWith(prefix);
  }

  goDashboard(): void {
    this.router.navigate(['/hospital-admin']);
  }
  goHospital(): void {
    this.router.navigate(['/hospital-admin/hospital']);
  }
  goDepartments(): void {
    this.router.navigate(['/hospital-admin/departments']);
  }
  goTreatments(): void {
    this.router.navigate(['/hospital-admin/treatments']);
  }
  goDoctors(): void {
    this.router.navigate(['/hospital-admin/doctors']);
  }
  goAvailability(): void {
    this.router.navigate(['/hospital-admin/availability']);
  }
  goRequests(): void {
    this.router.navigate(['/hospital-admin/requests']);
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/hospital-admin/login']);
  }
}
