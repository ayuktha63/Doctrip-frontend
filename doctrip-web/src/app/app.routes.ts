import { Routes } from '@angular/router';

// Top-level route map for the Website. Discovery areas (public,
// unauthenticated per docs/story_2.md) are wired here, plus the
// Login/Sign Up redirect target required by FE-WEB-2.9. The booking
// journey itself and the real login/signup experience do not exist yet
// — see FE-WEB-2.10/2.11 and the separate Patient Authentication story.
export const routes: Routes = [
  {
    path: '',
    redirectTo: 'treatments',
    pathMatch: 'full',
  },
  {
    path: 'treatments',
    loadChildren: () => import('./features/treatments/treatments.routes').then((m) => m.TREATMENTS_ROUTES),
  },
  {
    path: 'hospitals',
    loadChildren: () => import('./features/hospitals/hospitals.routes').then((m) => m.HOSPITALS_ROUTES),
  },
  {
    path: 'doctors',
    loadChildren: () => import('./features/doctors/doctors.routes').then((m) => m.DOCTORS_ROUTES),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login-placeholder/login-placeholder').then((m) => m.LoginPlaceholder),
  },
];
