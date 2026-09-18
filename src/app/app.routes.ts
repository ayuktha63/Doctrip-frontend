import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';
import { hospitalAdminAuthGuard } from './core/guards/hospital-admin-auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'home' },
  {
    path: '',
    loadComponent: () => import('./shared/components/app-shell/app-shell.component').then((m) => m.AppShellComponent),
    children: [
      {
        path: 'home',
        canActivate: [authGuard],
        loadComponent: () => import('./features/home/home.component').then((m) => m.HomeComponent),
      },
      {
        path: 'appointments',
        canActivate: [authGuard],
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/appointments/appointments.component').then((m) => m.AppointmentsComponent),
      },
      {
        path: 'appointments/:id',
        canActivate: [authGuard],
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/appointments/appointment-detail.component').then((m) => m.AppointmentDetailComponent),
      },
      {
        path: 'appointments/:id/payment',
        canActivate: [authGuard],
        loadComponent: () => import('./features/appointments/payment.component').then((m) => m.PaymentComponent),
      },
      {
        path: 'notifications',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/notifications/notifications.component').then((m) => m.NotificationsComponent),
      },
      {
        path: 'auth',
        canActivate: [guestGuard],
        loadComponent: () => import('./features/auth/auth-page.component').then((m) => m.AuthPageComponent),
      },
      {
        path: 'auth/otp',
        loadComponent: () => import('./features/auth/otp/otp-page.component').then((m) => m.OtpPageComponent),
      },
      {
        path: 'auth/callback',
        loadComponent: () =>
          import('./features/auth/callback/oauth-callback.component').then((m) => m.OAuthCallbackComponent),
      },
    ],
  },
  {
    // Story 3 — DocTrip Admin console. Separate top-level route tree from the patient app (its own
    // shell), not nested under the patient AppShellComponent. The reference mockup (Main.dc.html)
    // starts pre-authenticated with no login screen, so this story ships no admin auth — see
    // backend CLAUDE.md.
    path: 'admin',
    loadComponent: () =>
      import('./shared/components/admin-shell/admin-shell.component').then((m) => m.AdminShellComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
      },
      {
        path: 'hospitals',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/hospitals/hospital-list.component').then((m) => m.HospitalListComponent),
      },
      {
        path: 'hospitals/new',
        loadComponent: () =>
          import('./features/admin/hospitals/hospital-form.component').then((m) => m.HospitalFormComponent),
      },
      {
        path: 'hospitals/:id',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/admin/hospitals/hospital-detail.component').then((m) => m.HospitalDetailComponent),
      },
      {
        path: 'hospitals/:id/edit',
        loadComponent: () =>
          import('./features/admin/hospitals/hospital-form.component').then((m) => m.HospitalFormComponent),
      },
    ],
  },
  {
    // Story 4 — Hospital Admin console. A third top-level route tree, sibling to the patient
    // '' route and Story 3's 'admin' route — its own shell, its own login, its own JWT session
    // (HospitalAdminAuthService), scoped to a single hospital. See CLAUDE.md's "Story 4" section.
    path: 'hospital-admin/login',
    loadComponent: () =>
      import('./features/hospital-admin/login/hospital-admin-login.component').then(
        (m) => m.HospitalAdminLoginComponent,
      ),
  },
  {
    path: 'hospital-admin',
    canActivate: [hospitalAdminAuthGuard],
    loadComponent: () =>
      import('./shared/components/hospital-admin-shell/hospital-admin-shell.component').then(
        (m) => m.HospitalAdminShellComponent,
      ),
    children: [
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/hospital-admin/dashboard/hospital-admin-dashboard.component').then(
            (m) => m.HospitalAdminDashboardComponent,
          ),
      },
      {
        path: 'hospital',
        loadComponent: () =>
          import('./features/hospital-admin/hospital/hospital-admin-hospital.component').then(
            (m) => m.HospitalAdminHospitalComponent,
          ),
      },
      {
        path: 'departments',
        loadComponent: () =>
          import('./features/hospital-admin/departments/hospital-admin-departments.component').then(
            (m) => m.HospitalAdminDepartmentsComponent,
          ),
      },
      {
        path: 'treatments',
        loadComponent: () =>
          import('./features/hospital-admin/treatments/hospital-admin-treatments.component').then(
            (m) => m.HospitalAdminTreatmentsComponent,
          ),
      },
      {
        path: 'doctors',
        loadComponent: () =>
          import('./features/hospital-admin/doctors/hospital-admin-doctors.component').then(
            (m) => m.HospitalAdminDoctorsComponent,
          ),
      },
      {
        path: 'availability',
        loadComponent: () =>
          import('./features/hospital-admin/availability/hospital-admin-availability.component').then(
            (m) => m.HospitalAdminAvailabilityComponent,
          ),
      },
      {
        path: 'requests',
        loadComponent: () =>
          import('./features/hospital-admin/requests/hospital-admin-requests.component').then(
            (m) => m.HospitalAdminRequestsComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
