import { TeamMember } from '../doctors/doctor.model';

/**
 * Confirmed backend contract (verified live against the running
 * backend, both list and detail):
 * GET /api/public/treatment-packages returns an array of the summary
 * shape below; GET /api/public/treatment-packages/{id} returns the same
 * fields plus `team` (the doctors performing this package, at the
 * package's hospital).
 */
export interface TreatmentPackage {
  id: number;
  name: string;
  description?: string;
  department?: string;
  price?: number;
  typicalStay?: string;
  hospitalId?: number;
  hospitalName?: string;
  /**
   * Not yet in the confirmed TreatmentPackageDetailDto — optional so the
   * facts grid lights up automatically once the backend adds them
   * (derived from the linked Hospital, never fabricated client-side).
   */
  hospitalCity?: string;
  hospitalAccreditation?: string;
  team?: TeamMember[];
}
