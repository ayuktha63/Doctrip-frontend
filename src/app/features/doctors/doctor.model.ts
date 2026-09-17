/** A colleague/team-member reference, same shape on every detail endpoint's `team` array. */
export interface TeamMember {
  id: number;
  name: string;
  specialty?: string;
  department?: string;
  /**
   * Not yet in the confirmed DoctorTeamMemberDto — optional so team rows
   * light up with "· 18 yrs" automatically once the backend adds it.
   */
  experienceYears?: number;
}

/**
 * Confirmed backend contract (verified live against the running
 * backend, both list and detail):
 * GET /api/public/doctors (and its `?name=` search variant) returns an
 * array of the summary shape below; GET /api/public/doctors/{id}
 * returns the same fields plus `team` (colleagues at the same
 * hospital).
 */
export interface Doctor {
  id: number;
  name: string;
  description?: string;
  department?: string;
  specialty?: string;
  experienceYears?: number;
  rating?: number;
  reviewCount?: number;
  languages?: string;
  hospitalId?: number;
  hospitalName?: string;
  team?: TeamMember[];
}
