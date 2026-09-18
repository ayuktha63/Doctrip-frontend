/**
 * REST contract: GET /api/admin/appointment-requests?hospitalId=, GET
 * /api/admin/appointment-requests/{id}, GET
 * /api/admin/appointment-requests/{id}/doctor-availability, POST
 * /api/admin/appointment-requests/{id}/coordination/start. Cross-check against
 * Doctrip-backend's `dto/` package (same field names) if these ever drift. FR-01/FR-02/FR-04/FR-05
 * only — no doctor-response handling yet (FR-06 belongs to the Doctor's own story), no
 * escalation/expiry (FR-03/FR-10) yet either.
 */

export type AppointmentRequestStatus =
  | 'REQUESTED'
  | 'DOCTOR_COORDINATION'
  | 'DOCTOR_SELECTED'
  | 'ESCALATED'
  | 'CANCELLED'
  | 'CONFIRMED';

export type DoctorAcknowledgementStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'ALTERNATIVE_PROPOSED' | 'CLOSED';

export interface AppointmentRequestSummary {
  id: string;
  requestCode: string;
  patientName: string;
  patientCountry: string | null;
  department: string;
  requestedDoctorName: string | null;
  requestedDate: string;
  requestedTime: string;
  status: AppointmentRequestStatus;
  adminSlaDeadline: string;
  adminSlaBreached: boolean;
}

export interface DoctorAcknowledgementSummary {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string | null;
  status: DoctorAcknowledgementStatus;
  sentAt: string;
  responseDeadline: string;
  proposedDate: string | null;
  proposedTime: string | null;
}

export interface AppointmentRequestDetail {
  id: string;
  requestCode: string;
  patientId: string;
  patientName: string;
  patientCountry: string | null;
  patientAge: number | null;
  patientGender: string | null;
  hospitalId: string;
  hospitalName: string;
  department: string;
  requestedDoctorName: string | null;
  requestedDate: string;
  requestedTime: string;
  healthcareRequirement: string;
  additionalInfo: string | null;
  requiredDocuments: string[];
  status: AppointmentRequestStatus;
  adminSlaDeadline: string;
  adminSlaBreached: boolean;
  createdAt: string;
  updatedAt: string;
  coordination: DoctorAcknowledgementSummary[];
  securedDoctorName: string | null;
  securedDate: string | null;
  securedTime: string | null;
}

export interface DoctorCandidate {
  doctorId: string;
  name: string;
  specialty: string | null;
}

export interface DoctorAvailability {
  requestedDoctorName: string | null;
  requestedDoctorAvailable: boolean;
  eligibleDoctors: DoctorCandidate[];
}
