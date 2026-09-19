export type AppointmentStatus =
  | 'requested'
  | 'coordinating'
  | 'awaitingPatient'
  | 'confirmed'
  | 'cancelled'
  | 'expired';

export interface AppointmentLogEntry {
  title: string;
  body: string;
  time: string;
}

export interface Appointment {
  /** The backend's real id (UUID) — used for routing/API calls. */
  id: string;
  /** The backend's human-readable request code (e.g. "APR-0042") — used for display only. */
  code: string;
  treatment: string;
  hospital: string;
  dept: string;
  doctor: string;
  when: string;
  submitted: string;
  status: AppointmentStatus;
  log: AppointmentLogEntry[];
}

export interface NotificationItem {
  title: string;
  body: string;
  time: string;
  accent: string;
  tint: string;
  to: string;
}
