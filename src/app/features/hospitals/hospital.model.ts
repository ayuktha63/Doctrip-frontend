import { TeamMember } from '../doctors/doctor.model';

/**
 * Confirmed backend contract (verified live against the running
 * backend, both list and detail):
 * GET /api/public/hospitals (and its `?name=` search variant) returns
 * an array of the summary shape below; GET /api/public/hospitals/{id}
 * returns the same fields plus `team` (doctors at this hospital).
 */
export interface Hospital {
  id: number;
  name: string;
  description?: string;
  type?: string;
  city?: string;
  beds?: number;
  rating?: number;
  reviewCount?: number;
  accreditation?: string;
  languages?: string;
  /**
   * Not yet in the confirmed HospitalDetailDto — optional so the facts
   * grid lights up automatically once the backend adds a real derived
   * count (distinct departments among this hospital's doctors), never
   * fabricated client-side.
   */
  departmentCount?: number;
  team?: TeamMember[];
}
