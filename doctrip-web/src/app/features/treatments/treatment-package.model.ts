/**
 * UI display model for a treatment package card, per FE-WEB-2.1.
 *
 * This is NOT a confirmed backend response contract. Field names/types
 * here reflect only what the discovery list needs to render, inferred
 * from the UI prototype (docs/Doctrip Prototype (1) 2.html — treatment
 * package card template: name, department, length of stay, "from"
 * price). The real API response shape is undefined; once the backend
 * contract is confirmed, mapping code should translate the actual
 * response into this shape (or this model should be revised to match).
 *
 * `status` reflects the story's visibility rule (story_2.md — "Only
 * approved/published records should be shown", "Inactive records follow
 * the approved visibility rule"). The full set of possible status values
 * is undefined; only 'approved' is treated as publicly visible.
 *
 * `description` is an optional field added for FE-WEB-2.2 (package
 * details) so a visitor can understand/evaluate a package beyond the
 * list-card summary. It is not confirmed by any backend contract; if
 * missing, the details view must handle that gracefully (story_2.md —
 * "Missing profile information" edge case).
 */
export interface TreatmentPackage {
  id: string;
  name: string;
  status: 'approved' | string;
  department?: string;
  stayDuration?: string;
  priceFrom?: string;
  imageUrl?: string;
  description?: string;
}

export function isPubliclyVisible(pkg: TreatmentPackage): boolean {
  return pkg.status === 'approved';
}
