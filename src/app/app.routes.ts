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
  { path: '**', redirectTo: 'home' },
];
