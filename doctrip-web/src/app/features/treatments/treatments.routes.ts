import { Routes } from '@angular/router';

// FE-WEB-2.1: public treatment package listing.
// FE-WEB-2.2: treatment package details.
export const TREATMENTS_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./treatment-list/treatment-list').then((m) => m.TreatmentList),
  },
  {
    path: ':id',
    loadComponent: () => import('./treatment-detail/treatment-detail').then((m) => m.TreatmentDetail),
  },
];
