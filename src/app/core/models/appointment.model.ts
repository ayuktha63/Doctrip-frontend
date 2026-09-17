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
  id: string;
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
