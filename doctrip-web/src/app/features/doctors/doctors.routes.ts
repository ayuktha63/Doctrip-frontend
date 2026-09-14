import { Routes } from '@angular/router';

// FE-WEB-2.6: public doctor listing.
// FE-WEB-2.7: doctor search (integrated into the listing).
// FE-WEB-2.8: doctor details/profile.
export const DOCTORS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./doctor-list/doctor-list').then((m) => m.DoctorList),
  },
  {
    path: ':id',
    loadComponent: () => import('./doctor-detail/doctor-detail').then((m) => m.DoctorDetail),
  },
];
