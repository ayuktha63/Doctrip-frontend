/**
 * UI display model for a doctor card, per FE-WEB-2.6.
 *
 * This is NOT a confirmed backend response contract. Field names/types
 * here reflect only what the discovery list needs to render, inferred
 * from the UI prototype (docs/Doctrip Prototype (1) 2.html — doctor
 * card template: name, role/specialization, department, years of
 * experience, rating). The real API response shape is undefined; once
 * the backend contract is confirmed, mapping code should translate the
 * actual response into this shape (or this model should be revised to
 * match).
 *
 * Real-time availability fields seen in the prototype (e.g. day-of-week
 * slot pickers) are intentionally excluded: story_2.md states "Real-time
 * availability is not assumed unless explicitly approved."
 *
 * `status` reflects the story's visibility rule (story_2.md — "Only
 * approved/published records should be shown", "Inactive records follow
 * the approved visibility rule"). The full set of possible status values
 * is undefined; only 'approved' is treated as publicly visible.
 *
 * `description` is an optional field added for FE-WEB-2.8 (doctor
 * profile) so a visitor can view profile information beyond the
 * list-card summary. It is not confirmed by any backend contract; if
 * missing, the profile view must handle that gracefully (story_2.md —
 * "Missing profile information" edge case).
 */
export interface Doctor {
  id: string;
  name: string;
  status: 'approved' | string;
  role?: string;
  department?: string;
  experience?: string;
  rating?: string;
  imageUrl?: string;
  description?: string;
}

export function isPubliclyVisible(doctor: Doctor): boolean {
  return doctor.status === 'approved';
}
