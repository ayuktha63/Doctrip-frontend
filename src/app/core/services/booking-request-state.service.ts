import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TreatmentsService } from '../../features/treatments/treatments.service';
import { TreatmentPackage } from '../../features/treatments/treatment-package.model';
import { HospitalsService } from '../../features/hospitals/hospitals.service';
import { Hospital } from '../../features/hospitals/hospital.model';
import { DoctorsService } from '../../features/doctors/doctors.service';
import { Doctor } from '../../features/doctors/doctor.model';
import { AppointmentsStateService } from './appointments-state.service';
import { BookingRequestForm, EMPTY_BOOKING_FORM, REQUIRED_BOOKING_FIELDS } from '../models/booking-request.model';

export type BookingSegment = 'treatment' | 'hospital' | 'doctor';

/** The record summary shown read-only at the top of the booking form — one shape for all three kinds. */
export interface BookingRecordSummary {
  title: string;
  hospital: string;
  dept: string;
  doctor: string;
}

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

export type BookingLoadState = 'idle' | 'loading' | 'loaded' | 'unavailable' | 'error';

/**
 * Backs the discover → booking journey (`/booking/:kind/:id` → book form →
 * `/booking/:kind/:id/review`). The record itself (treatment/hospital/doctor) comes from the
 * real, already-confirmed public discovery endpoints; the request form fields and preferred
 * slot are client-only, same simulation convention as AppointmentsStateService, since no
 * backend appointment-creation endpoint exists yet.
 */
@Injectable({ providedIn: 'root' })
export class BookingRequestStateService {
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly hospitalsService = inject(HospitalsService);
  private readonly doctorsService = inject(DoctorsService);
  private readonly appointmentsState = inject(AppointmentsStateService);

  readonly days = DAYS;
  readonly times = TIMES;

  private loadedKind: BookingSegment | null = null;
  private loadedId: string | null = null;

  readonly state = signal<BookingLoadState>('idle');
  readonly record = signal<BookingRecordSummary | null>(null);

  readonly form = signal<BookingRequestForm>({ ...EMPTY_BOOKING_FORM });
  readonly formErrors = signal<Partial<Record<keyof BookingRequestForm, string>>>({});
  readonly day = signal<number>(this.days[0][1]);
  readonly time = signal<string>(this.times[0]);
  readonly docs = signal<string[]>([]);

  readonly whenLabel = computed(() => {
    const dayLabel = this.days.find(([, num]) => num === this.day())?.[0] ?? '';
    return `${dayLabel} ${this.day()} May 2024, ${this.time()}`;
  });

  /** Loads (or re-uses, if navigating book → review → book for the same record) the summary. */
  ensureLoaded(kind: BookingSegment, id: string): void {
    if (this.loadedKind === kind && this.loadedId === id && this.state() !== 'idle' && this.state() !== 'error') {
      return;
    }
    this.loadedKind = kind;
    this.loadedId = id;
    this.state.set('loading');

    const onError = (err: HttpErrorResponse): void => {
      this.state.set(err.status === 404 ? 'unavailable' : 'error');
    };
    const onLoaded = (summary: BookingRecordSummary): void => {
      this.record.set(summary);
      this.state.set('loaded');
    };

    switch (kind) {
      case 'treatment':
        this.treatmentsService.getTreatmentPackageById(id).subscribe({
          next: (r: TreatmentPackage) =>
            onLoaded({
              title: r.name,
              hospital: r.hospitalName ?? 'To be confirmed',
              dept: r.department ?? 'To be confirmed',
              doctor: 'To be assigned',
            }),
          error: onError,
        });
        break;
      case 'hospital':
        this.hospitalsService.getHospitalById(id).subscribe({
          next: (r: Hospital) =>
            onLoaded({ title: r.name, hospital: r.name, dept: r.type ?? 'General', doctor: 'To be assigned' }),
          error: onError,
        });
        break;
      case 'doctor':
        this.doctorsService.getDoctorById(id).subscribe({
          next: (r: Doctor) =>
            onLoaded({
              title: r.name,
              hospital: r.hospitalName ?? 'To be confirmed',
              dept: r.department ?? r.specialty ?? 'To be confirmed',
              doctor: r.name,
            }),
          error: onError,
        });
        break;
    }
  }

  setFormField(key: keyof BookingRequestForm, value: string): void {
    this.form.update((f) => ({ ...f, [key]: value }));
  }

  addDoc(): void {
    this.docs.update((d) => [...d, `Document ${d.length + 1}.pdf`]);
  }

  removeDoc(index: number): void {
    this.docs.update((d) => d.filter((_, i) => i !== index));
  }

  /** Validates the fields required before "Review request" is allowed to proceed. */
  validate(): boolean {
    const f = this.form();
    const errors: Partial<Record<keyof BookingRequestForm, string>> = {};
    for (const key of REQUIRED_BOOKING_FIELDS) {
      if (!f[key].trim()) {
        errors[key] = 'Required';
      }
    }
    this.formErrors.set(errors);
    return Object.keys(errors).length === 0;
  }

  /** Creates the appointment from the current form + selected record and resets this service's state. */
  submit(): string {
    const record = this.record();
    const id = this.appointmentsState.createFromRequest({
      treatment: record?.title ?? this.form().need,
      hospital: record?.hospital ?? 'To be confirmed',
      dept: record?.dept ?? 'To be confirmed',
      doctor: record?.doctor ?? 'Not assigned',
      when: this.whenLabel(),
    });
    this.reset();
    return id;
  }

  private reset(): void {
    this.loadedKind = null;
    this.loadedId = null;
    this.state.set('idle');
    this.record.set(null);
    this.form.set({ ...EMPTY_BOOKING_FORM });
    this.formErrors.set({});
    this.docs.set([]);
  }
}
