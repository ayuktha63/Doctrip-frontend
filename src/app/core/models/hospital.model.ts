/**
 * REST contract: POST/GET/PUT /api/admin/hospitals[/{id}], POST /api/admin/hospitals/{id}/status,
 * GET /api/hospitals (public discovery). Cross-check against Doctrip-backend's `dto/` package
 * (same field names) if these ever drift. No admin auth exists in this story — see backend
 * CLAUDE.md for why.
 */

export interface Hospital {
  id: string;
  hospitalCode: string;
  name: string;
  type: string;
  city: string;
  state: string;
  registrationNumber: string | null;
  accreditation: string | null;
  beds: number;
  contactPerson: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/** Shared shape for both create and edit — matches Doctrip-backend's HospitalRequest exactly. */
export interface HospitalRequest {
  name: string;
  type: string;
  city: string;
  state: string;
  registrationNumber: string;
  accreditation: string;
  beds: number | null;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
}

export interface HospitalStatusRequest {
  active: boolean;
}

export interface HospitalSummary {
  hospitalCode: string;
  name: string;
  type: string;
  city: string;
  state: string;
  beds: number;
  accreditation: string | null;
}
