import { Routes } from '@angular/router';

// FE-WEB-2.3: public hospital listing.
// FE-WEB-2.4: hospital search (integrated into the listing).
// FE-WEB-2.5: hospital details/profile.
export const HOSPITALS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./hospital-list/hospital-list').then((m) => m.HospitalList),
  },
  {
    path: ':id',
    loadComponent: () => import('./hospital-detail/hospital-detail').then((m) => m.HospitalDetail),
  },
];
