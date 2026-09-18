import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { guestGuard } from './core/guards/guest.guard';

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
      // Story 2 — Healthcare Discovery. Unified page (matches
      // docs/"doctrip-web-panels 2.html", PatientPanel.dc.html's
      // Discover/Detail screens): one search+tabs page plus one detail
      // route across treatments/hospitals/doctors. Public: no
      // canActivate guard, per story_2.md ("Treatment, hospital and
      // doctor discovery does not require authentication"). Only the
      // Book appointment action inside the detail page checks auth, via
      // BookingHandoffService.
      {
        path: 'discover',
        loadChildren: () => import('./features/discover/discover.routes').then((m) => m.DISCOVER_ROUTES),
      },
      // Landing target for BookingHandoffService.proceed() — see
      // booking-placeholder.ts for why this exists and what it is not.
      {
        path: 'booking/:kind/:id',
        canActivate: [authGuard],
        loadComponent: () =>
          import('./features/booking/booking-placeholder/booking-placeholder').then((m) => m.BookingPlaceholder),
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
    // Hospital Appointment Coordination story — Hospital Admin's coordination desk. Its own
    // top-level shell (HospitalAdminShellComponent), distinct from DocTrip Admin's /admin console
    // above (different persona: a Hospital Admin only coordinates their own hospital's
    // appointments, not platform-wide hospital master records). Only "Requests" (FR-01 onward) is
    // functional — the other sidebar tabs are real nav items routing to a placeholder screen; see
    // HospitalAdminShellComponent's doc comment for why.
    path: 'hospital-admin',
    loadComponent: () =>
      import('./shared/components/hospital-admin-shell/hospital-admin-shell.component').then(
        (m) => m.HospitalAdminShellComponent,
      ),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'requests' },
      {
        path: 'dashboard',
        data: { title: 'Coordination desk' },
        loadComponent: () =>
          import('./features/hospital-admin/placeholder/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'hospital',
        data: { title: 'Hospital' },
        loadComponent: () =>
          import('./features/hospital-admin/placeholder/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'departments',
        data: { title: 'Departments' },
        loadComponent: () =>
          import('./features/hospital-admin/placeholder/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'doctors',
        data: { title: 'Doctors' },
        loadComponent: () =>
          import('./features/hospital-admin/placeholder/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'availability',
        data: { title: 'Doctor availability' },
        loadComponent: () =>
          import('./features/hospital-admin/placeholder/coming-soon.component').then((m) => m.ComingSoonComponent),
      },
      {
        path: 'requests',
        pathMatch: 'full',
        loadComponent: () =>
          import('./features/hospital-admin/requests/request-list.component').then((m) => m.RequestListComponent),
      },
      {
        path: 'requests/:id',
        loadComponent: () =>
          import('./features/hospital-admin/requests/request-detail.component').then(
            (m) => m.RequestDetailComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: 'home' },
];
