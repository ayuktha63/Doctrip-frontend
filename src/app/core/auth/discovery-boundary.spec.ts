import { TreatmentsService } from '../../features/treatments/treatments.service';
import { HospitalsService } from '../../features/hospitals/hospitals.service';
import { DoctorsService } from '../../features/doctors/doctors.service';

/**
 * FE-WEB-2.13 — Public Discovery Access and Protected Booking Boundary.
 *
 * story_2.md: "Public discovery data shall be available without
 * requiring a patient session." and "Treatment, hospital and doctor
 * discovery does not require authentication."
 *
 * These are static conformance checks on the discovery integration
 * boundaries themselves: they assert the treatments/hospitals/doctors
 * services never reference AuthService or an Authorization header, by
 * inspecting their compiled source text, so a future change cannot
 * silently make discovery data depend on authentication without a test
 * failing here.
 */
const DISCOVERY_SERVICES: readonly [string, Function][] = [
  ['TreatmentsService', TreatmentsService],
  ['HospitalsService', HospitalsService],
  ['DoctorsService', DoctorsService],
];

describe('Discovery service boundary (FE-WEB-2.13)', () => {
  it.each(DISCOVERY_SERVICES)('%s does not depend on AuthService or an auth header', (_name, serviceClass) => {
    const source = serviceClass.toString();
    expect(source).not.toMatch(/AuthService/);
    expect(source).not.toMatch(/Authorization/i);
    expect(source).not.toMatch(/isAuthenticated/);
  });
});
