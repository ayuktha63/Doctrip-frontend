/**
 * REST contract (base `${environment.apiBaseUrl}/api/hospital-admin`):
 * POST /auth/login, GET /hospital, GET+PUT /hospital/operational-settings,
 * GET/POST/PUT/PATCH /departments[/{id}[/status]],
 * GET/POST/PUT/PATCH /doctors[/{id}[/status]],
 * GET/POST/DELETE /doctors/{doctorId}/availability[/{id}],
 * GET/POST/PUT/PATCH /treatments[/{id}[/status]].
 * All list/create/update calls are scoped server-side to the logged-in admin's own hospital via
 * the JWT — never pass a hospitalId param from the frontend. Reuses `ApiError` from
 * `auth.model.ts` rather than duplicating it (same shape across the whole backend).
 */

export interface HospitalAdminLoginRequest {
  email: string;
  password: string;
}

export interface HospitalAdminLoginResponse {
  accessToken: string;
  expiresIn: number;
  hospitalId: string;
  hospitalName: string;
}

export interface HospitalAdminHospital {
  id: string;
  hospitalCode: string;
  name: string;
  type: string;
  city: string;
  state: string;
  accreditation: string | null;
  beds: number;
}

/** Fields may be null if never set — render as empty inputs, not an error state. */
export interface OperationalSettings {
  hospitalId: string;
  sla: string | null;
  coordinationWindow: string | null;
  escalationContact: string | null;
  languagesSupported: string | null;
  minLeadTime: string | null;
  interpreterAvailability: string | null;
}

export type OperationalSettingsRequest = Omit<OperationalSettings, 'hospitalId'>;

export interface Department {
  id: string;
  name: string;
  code: string;
  head: string;
  active: boolean;
  doctorCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentRequest {
  name: string;
  code: string;
  head: string;
}

export interface StatusRequest {
  active: boolean;
}

export interface Doctor {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  specialty: string;
  experienceYears: number;
  /** Where an appointment-coordination request is actually emailed to this doctor. */
  email: string | null;
  active: boolean;
}

export interface DoctorRequest {
  name: string;
  departmentId: string;
  specialty: string;
  experienceYears: number | null;
  email: string;
}

export type AvailabilityKind = 'REGULAR' | 'EXTRA' | 'BLOCKED' | string;

export interface AvailabilitySlot {
  id: string;
  doctorId: string;
  slotDate: string;
  startTime: string;
  endTime: string;
  kind: AvailabilityKind;
}

export interface AvailabilityRequest {
  slotDate: string;
  startTime: string;
  endTime: string;
  kind: AvailabilityKind;
}

export interface Treatment {
  id: string;
  name: string;
  departmentId: string;
  departmentName: string;
  price: number;
  consultationFee: number;
  typicalStay: string;
  description: string;
  listed: boolean;
}

export interface TreatmentRequest {
  name: string;
  departmentId: string;
  price: number | null;
  consultationFee: number | null;
  typicalStay: string;
  description: string;
}

/**
 * Dashboard "Coordination desk" — GET /dashboard/summary. Requires a backend endpoint that did
 * not originally exist for Story 4 (see CLAUDE.md's Story 4 section); the frontend calls it
 * expecting this exact shape and shows a friendly empty state if the endpoint 404s.
 */
export type RequestStatus = 'NEW' | 'IN_COORDINATION' | 'AWAITING_DOCTOR' | 'AWAITING_PATIENT' | 'CONFIRMED' | 'CANCELLED';

export interface DashboardKpis {
  newRequests: number;
  inCoordination: number;
  awaitingDoctor: number;
  awaitingPatient: number;
  upcomingAppointments: number;
  slaBreaches: number;
}

export interface DashboardPipeline {
  newRequests: number;
  inCoordination: number;
  awaitingDoctor: number;
  awaitingPatient: number;
  confirmed: number;
  cancelled: number;
}

export interface DashboardAttentionItem {
  id: string;
  patientName: string;
  department: string;
  requestedAt: string;
  status: RequestStatus;
  slaMinutesRemaining: number;
}

export interface DashboardSlaAlert {
  id: string;
  patientName: string;
  message: string;
}

export interface DashboardUpcomingAppointment {
  id: string;
  day: number;
  month: string;
  patientName: string;
  doctorName: string;
  time: string;
}

export interface DashboardSummary {
  kpis: DashboardKpis;
  pipeline: DashboardPipeline;
  needsAttention: DashboardAttentionItem[];
  slaAlerts: DashboardSlaAlert[];
  upcomingAppointments: DashboardUpcomingAppointment[];
}
