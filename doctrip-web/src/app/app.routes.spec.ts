import { Routes } from '@angular/router';
import { routes } from './app.routes';
import { TREATMENTS_ROUTES } from './features/treatments/treatments.routes';
import { HOSPITALS_ROUTES } from './features/hospitals/hospitals.routes';
import { DOCTORS_ROUTES } from './features/doctors/doctors.routes';

/**
 * FE-WEB-2.13 — Public Discovery Access and Protected Booking Boundary.
 *
 * story_2.md: "Treatment, hospital and doctor discovery does not require
 * authentication." These tests guard the route configuration itself so
 * a future change cannot silently attach a route guard (canActivate /
 * canMatch) to any discovery route without a test failing here.
 */
function assertNoGuards(routeList: Routes, label: string) {
  for (const route of routeList) {
    expect(route.canActivate, `${label} route "${route.path}" must not have canActivate`).toBeUndefined();
    expect(route.canMatch, `${label} route "${route.path}" must not have canMatch`).toBeUndefined();
    expect(
      route.canActivateChild,
      `${label} route "${route.path}" must not have canActivateChild`,
    ).toBeUndefined();
  }
}

describe('Discovery routing boundary (FE-WEB-2.13)', () => {
  it('does not guard the top-level treatments, hospitals, or doctors routes', () => {
    const discoveryEntryPoints = routes.filter((route) =>
      ['treatments', 'hospitals', 'doctors'].includes(route.path ?? ''),
    );
    expect(discoveryEntryPoints).toHaveLength(3);
    assertNoGuards(discoveryEntryPoints, 'top-level');
  });

  it('does not guard the treatment listing or detail routes', () => {
    assertNoGuards(TREATMENTS_ROUTES, 'treatments');
  });

  it('does not guard the hospital listing or detail routes', () => {
    assertNoGuards(HOSPITALS_ROUTES, 'hospitals');
  });

  it('does not guard the doctor listing or detail routes', () => {
    assertNoGuards(DOCTORS_ROUTES, 'doctors');
  });

  it('does not register a booking route (booking entry has no route to browse into yet)', () => {
    const bookingRoute = routes.find((route) => (route.path ?? '').startsWith('booking'));
    expect(bookingRoute).toBeUndefined();
  });
});
