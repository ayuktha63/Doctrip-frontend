import { Routes } from '@angular/router';

// Story 2 — Healthcare Discovery, unified page (matches
// docs/"doctrip-web-panels 2.html", PatientPanel.dc.html's Discover /
// Detail screens). Public: no canActivate guard, per story_2.md
// ("Treatment, hospital and doctor discovery does not require
// authentication"). Only the Book appointment action checks auth, via
// BookingHandoffService.
export const DISCOVER_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () => import('./discover-home/discover-home').then((m) => m.DiscoverHome),
  },
  {
    path: ':type/:id',
    loadComponent: () => import('./discover-detail/discover-detail').then((m) => m.DiscoverDetail),
  },
];
