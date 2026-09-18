import { Injectable, computed, inject, signal } from '@angular/core';
import { ToastService } from './toast.service';
import { Appointment, AppointmentStatus, NotificationItem } from '../models/appointment.model';

const DAYS: [string, number][] = [
  ['Mon', 20],
  ['Tue', 21],
  ['Wed', 22],
  ['Thu', 23],
  ['Fri', 24],
  ['Sat', 25],
  ['Sun', 26],
];
const TIMES = ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'];

const STATUS_META: Record<AppointmentStatus, [string, string, string]> = {
  requested: ['Requested', '#1A6DF0', '#EAF1FE'],
  coordinating: ['In coordination', '#7C3AED', '#F1EAFE'],
  awaitingPatient: ['Awaiting your confirmation', '#0891B2', '#E3F5F9'],
  confirmed: ['Confirmed', '#16A34A', '#E7F6EC'],
  cancelled: ['Cancelled', '#DC2626', '#FCECEC'],
  expired: ['Expired', '#9AA4B2', '#F1F5FA'],
};

const INITIAL_APPOINTMENTS: Appointment[] = [
  {
    id: 'APT-2051',
    treatment: 'Knee Replacement Surgery',
    hospital: 'Aster Medcity',
    dept: 'Orthopaedics',
    doctor: 'Dr. Nandita Rao',
    when: '24 May 2024, 02:00 PM',
    submitted: '16 May',
    status: 'awaitingPatient',
    log: [
      { title: 'Request submitted', body: 'Sent to Aster Medcity for coordination.', time: '16 May, 11:05' },
      { title: 'In coordination', body: 'The international desk picked up your request.', time: '16 May, 11:30' },
      { title: 'Doctor confirmed', body: 'Dr. Nandita Rao acknowledged the slot.', time: '16 May, 15:22' },
      { title: 'Proposal ready', body: 'Confirm and pay to lock the appointment in.', time: '16 May, 15:30' },
    ],
  },
  {
    id: 'APT-2048',
    treatment: 'Cardiology Consultation',
    hospital: 'Aster Medcity',
    dept: 'Cardiology',
    doctor: 'Dr. Ramesh Nair',
    when: '23 May 2024, 11:00 AM',
    submitted: '17 May',
    status: 'coordinating',
    log: [
      { title: 'Request submitted', body: 'Sent to Aster Medcity for coordination.', time: '17 May, 16:40' },
      {
        title: 'In coordination',
        body: 'The international desk is matching a consultant to your dates.',
        time: '17 May, 17:05',
      },
    ],
  },
  {
    id: 'APT-2044',
    treatment: 'Cancer Screening Package',
    hospital: 'Amrita Hospital',
    dept: 'Oncology',
    doctor: 'Dr. Anjali Menon',
    when: '22 May 2024, 09:30 AM',
    submitted: '17 May',
    status: 'requested',
    log: [{ title: 'Request submitted', body: 'Sent to Amrita Hospital for coordination.', time: '17 May, 08:20' }],
  },
  {
    id: 'APT-2039',
    treatment: 'Neurology Consultation',
    hospital: 'Aster Medcity',
    dept: 'Neurology',
    doctor: 'Dr. Praveen Das',
    when: '20 May 2024, 03:00 PM',
    submitted: '15 May',
    status: 'confirmed',
    log: [
      { title: 'Request submitted', body: 'Sent to Aster Medcity for coordination.', time: '15 May, 14:15' },
      { title: 'Doctor confirmed', body: 'Dr. Praveen Das acknowledged the slot.', time: '15 May, 17:10' },
      { title: 'Confirmed and paid', body: 'Appointment booked for 20 May, 03:00 PM.', time: '16 May, 08:02' },
    ],
  },
  {
    id: 'APT-2030',
    treatment: 'Dental Implant Consultation',
    hospital: 'Rajagiri Hospital',
    dept: 'Dental care',
    doctor: 'Dr. Sanjay Kurup',
    when: '19 May 2024, 10:00 AM',
    submitted: '14 May',
    status: 'cancelled',
    log: [
      { title: 'Request submitted', body: 'Sent to Rajagiri Hospital for coordination.', time: '14 May, 10:00' },
      { title: 'Cancelled', body: 'You cancelled this request. Nothing was charged.', time: '15 May, 19:44' },
    ],
  },
  {
    id: 'APT-2018',
    treatment: 'Ayurveda Wellness Programme',
    hospital: 'Rajagiri Hospital',
    dept: 'Wellness',
    doctor: 'Not assigned',
    when: '14 May 2024, 11:00 AM',
    submitted: '5 May',
    status: 'expired',
    log: [
      { title: 'Request submitted', body: 'Sent to Rajagiri Hospital for coordination.', time: '5 May, 07:10' },
      {
        title: 'Request expired',
        body: 'No consultant became available within 7 days, so the request closed. Nothing was charged.',
        time: '12 May, 07:00',
      },
    ],
  },
];

/**
 * Client-only dummy data + simulated flow for My appointments — a direct port of
 * `PatientPanel.dc.html`'s appointment-related `Component` state and logic (no Discover/booking:
 * this branch intentionally ships appointments management only). Nothing here calls the backend;
 * it's a prototype-fidelity simulation, same as the reference mockup, wired with Angular signals
 * instead of React state.
 */
@Injectable({ providedIn: 'root' })
export class AppointmentsStateService {
  readonly days = DAYS;
  readonly times = TIMES;

  readonly appointments = signal<Appointment[]>(INITIAL_APPOINTMENTS);
  readonly currentAppointmentId = signal<string>('APT-2051');

  readonly pay = signal<'processing' | 'done'>('processing');

  readonly altOpen = signal(false);
  readonly altDay = signal(23);
  readonly altTime = signal('02:00 PM');

  readonly notifRead = signal(false);

  private readonly toast = inject(ToastService);

  readonly decoratedAppointments = computed(() => this.appointments().map((a) => this.decorate(a)));

  readonly currentAppointment = computed(() => {
    const list = this.appointments();
    const found = list.find((a) => a.id === this.currentAppointmentId()) ?? list[0];
    return this.decorate(found);
  });

  readonly notifications = computed<NotificationItem[]>(() => [
    {
      title: 'Request submitted',
      body: 'APT-2044 reached Amrita Hospital. They will assign a consultant.',
      time: '17 May, 08:20',
      accent: '#1A6DF0',
      tint: '#EAF1FE',
      to: 'APT-2044',
    },
    {
      title: 'Appointment proposal',
      body: 'Dr. Nandita Rao confirmed 24 May, 02:00 PM for APT-2051. Confirm and pay to book it.',
      time: '16 May, 15:30',
      accent: '#0891B2',
      tint: '#E3F5F9',
      to: 'APT-2051',
    },
    {
      title: 'Confirmation reminder',
      body: 'APT-2051 is held for another 24 hours. Confirm before the hold lapses.',
      time: '17 May, 09:00',
      accent: '#B26A00',
      tint: '#FFF6E6',
      to: 'APT-2051',
    },
    {
      title: 'Appointment confirmed',
      body: 'APT-2039 with Dr. Praveen Das on 20 May, 03:00 PM is booked.',
      time: '16 May, 08:02',
      accent: '#16A34A',
      tint: '#E7F6EC',
      to: 'APT-2039',
    },
    {
      title: 'Cancellation',
      body: 'APT-2030 was cancelled. Nothing was charged to you.',
      time: '15 May, 19:44',
      accent: '#DC2626',
      tint: '#FCECEC',
      to: 'APT-2030',
    },
    {
      title: 'Request expired',
      body: 'APT-2018 to Rajagiri Hospital closed after 7 days with no consultant available.',
      time: '12 May, 07:00',
      accent: '#9AA4B2',
      tint: '#F1F5FA',
      to: 'APT-2018',
    },
  ]);

  readonly unreadCount = computed(() => (this.notifRead() ? 0 : 3));

  private decorate(a: Appointment) {
    const [statusLabel, accent, tint] = STATUS_META[a.status];
    const nudge: Record<AppointmentStatus, string> = {
      requested: 'Waiting for the hospital',
      coordinating: 'Hospital is coordinating',
      awaitingPatient: 'Needs your confirmation',
      confirmed: 'All set',
      cancelled: 'Closed',
      expired: 'Closed',
    };
    return {
      ...a,
      statusLabel,
      accent,
      tint,
      whenLabel: a.status === 'confirmed' || a.status === 'awaitingPatient' ? 'Appointment' : 'Requested for',
      needsYou: a.status === 'awaitingPatient',
      nudge: nudge[a.status],
    };
  }

  private patch(id: string, changes: Partial<Appointment>, entry?: { title: string; body: string; time: string }): void {
    this.appointments.update((list) =>
      list.map((a) => (a.id !== id ? a : { ...a, ...changes, log: entry ? [...a.log, entry] : a.log })),
    );
  }

  /**
   * Discover → booking flow's submit step (BookReviewComponent). Creates a new
   * client-only appointment the same way the rest of this service's dummy data is
   * shaped — no backend appointment-creation endpoint exists yet — and returns its
   * id so the caller can navigate to the detail screen.
   */
  createFromRequest(input: { treatment: string; hospital: string; dept: string; doctor: string; when: string }): string {
    const id = `APT-${Math.floor(2000 + Math.random() * 900)}`;
    const submitted = new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
    const appointment: Appointment = {
      id,
      treatment: input.treatment,
      hospital: input.hospital,
      dept: input.dept,
      doctor: input.doctor || 'Not assigned',
      when: input.when,
      submitted,
      status: 'requested',
      log: [{ title: 'Request submitted', body: `Sent to ${input.hospital} for coordination.`, time: submitted }],
    };
    this.appointments.update((list) => [appointment, ...list]);
    this.currentAppointmentId.set(id);
    return id;
  }

  finalise(id: string): void {
    this.currentAppointmentId.set(id);
    this.pay.set('processing');
  }

  completePayment(): void {
    this.patch(this.currentAppointmentId(), { status: 'confirmed' }, {
      title: 'Confirmed and paid',
      body: 'Appointment booked. Confirmation sent to your email.',
      time: '18 May, 09:20',
    });
    this.pay.set('done');
  }

  openAlt(): void {
    this.altOpen.set(true);
  }

  closeAlt(): void {
    this.altOpen.set(false);
  }

  submitAlt(): void {
    const id = this.currentAppointmentId();
    const label = `${this.altDay()} May 2024, ${this.altTime()}`;
    this.patch(id, { status: 'coordinating' }, {
      title: 'Alternative slot requested',
      body: `You asked for ${label}. The hospital is checking the consultant's list.`,
      time: '18 May, 09:15',
    });
    this.altOpen.set(false);
    this.toast.show('Sent. The hospital will come back with a new proposal.');
    setTimeout(() => {
      this.patch(id, { status: 'awaitingPatient', when: label }, {
        title: 'New proposal ready',
        body: `The hospital confirmed ${label}. Confirm and pay to lock it in.`,
        time: '18 May, 09:18',
      });
      this.toast.show('A new proposal is ready.');
    }, 2800);
  }

  cancel(id: string): void {
    this.patch(id, { status: 'cancelled' }, {
      title: 'Cancelled',
      body: 'You cancelled this request. Nothing was charged.',
      time: '18 May, 09:16',
    });
    this.toast.show('Appointment cancelled.');
  }

  markAllRead(): void {
    this.notifRead.set(true);
  }
}
