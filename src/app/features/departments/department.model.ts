import { Doctor } from '../doctors/doctor.model';
import { Hospital } from '../hospitals/hospital.model';
import { TreatmentPackage } from '../treatments/treatment-package.model';

/**
 * Confirmed backend contract (verified live against the running backend):
 * GET /api/public/departments returns an array of the summary shape below;
 * GET /api/public/departments/{name} returns the same fields plus the actual
 * treatments/doctors/hospitals filed under that department. Aggregated purely from the already-
 * confirmed `department` field on approved Doctor/TreatmentPackage rows — see backend
 * `DepartmentDiscoveryService` for how counts and `hospitalNames` are derived. Nothing here is a
 * fabricated/hardcoded catalog value (no icon or blurb from the backend — the tile grid's tint is
 * a fixed deterministic palette on the frontend, matching how `KIND_CONFIG` already does this for
 * the other 3 tabs).
 */
export interface DepartmentSummary {
  name: string;
  treatmentCount: number;
  doctorCount: number;
  hospitalNames: string[];
  /** Cheapest approved treatment price in this department, or null if none has a price set. */
  fromPrice: number | null;
}

export interface DepartmentDetail extends DepartmentSummary {
  treatments: TreatmentPackage[];
  doctors: Doctor[];
  hospitals: Hospital[];
}
