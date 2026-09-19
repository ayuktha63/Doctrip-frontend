import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { TreatmentsService } from '../../features/treatments/treatments.service';
import { TreatmentPackage } from '../../features/treatments/treatment-package.model';
import { HospitalsService } from '../../features/hospitals/hospitals.service';
import { Hospital } from '../../features/hospitals/hospital.model';
import { DoctorsService } from '../../features/doctors/doctors.service';
import { Doctor } from '../../features/doctors/doctor.model';
import { PatientAppointmentsService } from './patient-appointments.service';
import { BookingRequestForm, EMPTY_BOOKING_FORM, REQUIRED_BOOKING_FIELDS } from '../models/booking-request.model';

export type BookingSegment = 'treatment' | 'hospital' | 'doctor';

/** The record summary shown read-only at the top of the booking form — one shape for all three kinds. */
export interface BookingRecordSummary {
  title: string;
  hospital: string;
  dept: string;
  doctor: string;
  /** Story 2 public-discovery hospital id — what the real create call resolves to an admin hospital via. */
  discoveryHospitalId: number;
}

interface DateOption {
  label: string;
  num: number;
  iso: string;
}

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function nextSevenDays(): DateOption[] {
  const options: DateOption[] = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    options.push({ label: WEEKDAY_LABELS[d.getDay()], num: d.getDate(), iso: d.toISOString().slice(0, 10) });
  }
  return options;
}

const TIME_OPTIONS: { label: string; iso: string }[] = [
  { label: '09:00 AM', iso: '09:00' },
  { label: '10:00 AM', iso: '10:00' },
  { label: '11:00 AM', iso: '11:00' },
  { label: '02:00 PM', iso: '14:00' },
  { label: '03:00 PM', iso: '15:00' },
  { label: '04:00 PM', iso: '16:00' },
];

export type BookingLoadState = 'idle' | 'loading' | 'loaded' | 'unavailable' | 'error';

/**
 * Backs the discover → booking journey (`/booking/:kind/:id` → book form →
 * `/booking/:kind/:id/review`). The record itself (treatment/hospital/doctor) comes from the
 * real, already-confirmed public discovery endpoints; submitting creates a real
 * AppointmentRequest via PatientAppointmentsService, landing in Hospital Admin's actual
 * coordination queue.
 */
@Injectable({ providedIn: 'root' })
export class BookingRequestStateService {
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly hospitalsService = inject(HospitalsService);
  private readonly doctorsService = inject(DoctorsService);
  private readonly patientAppointmentsService = inject(PatientAppointmentsService);

  readonly days: DateOption[] = nextSevenDays();
  readonly times = TIME_OPTIONS;

  private loadedKind: BookingSegment | null = null;
  private loadedId: string | null = null;

  readonly state = signal<BookingLoadState>('idle');
  readonly record = signal<BookingRecordSummary | null>(null);

  readonly form = signal<BookingRequestForm>({ ...EMPTY_BOOKING_FORM });
  readonly formErrors = signal<Partial<Record<keyof BookingRequestForm, string>>>({});
  readonly day = signal<number>(this.days[0].num);
  readonly time = signal<string>(this.times[0].label);
  readonly docs = signal<string[]>([]);
  readonly submitError = signal<string | null>(null);

  readonly whenLabel = computed(() => {
    const option = this.days.find((d) => d.num === this.day());
    return `${option?.label ?? ''} ${this.day()}, ${this.time()}`;
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
              discoveryHospitalId: r.hospitalId ?? 0,
            }),
          error: onError,
        });
        break;
      case 'hospital':
        this.hospitalsService.getHospitalById(id).subscribe({
          next: (r: Hospital) =>
            onLoaded({
              title: r.name,
              hospital: r.name,
              dept: r.type ?? 'General',
              doctor: 'To be assigned',
              discoveryHospitalId: r.id,
            }),
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
              discoveryHospitalId: r.hospitalId ?? 0,
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

  /** Creates the real appointment request from the current form + selected record. */
  submit(): Promise<string> {
    const record = this.record();
    const f = this.form();
    const dateOption = this.days.find((d) => d.num === this.day());
    const timeOption = this.times.find((t) => t.label === this.time());
    const age = Number.parseInt(f.age, 10);

    return new Promise((resolve, reject) => {
      this.patientAppointmentsService
        .create({
          discoveryHospitalId: record?.discoveryHospitalId ?? 0,
          department: record?.dept ?? 'To be confirmed',
          requestedDoctorName: record?.doctor && record.doctor !== 'To be assigned' ? record.doctor : undefined,
          requestedDate: dateOption?.iso ?? this.days[0].iso,
          requestedTime: timeOption?.iso ?? this.times[0].iso,
          healthcareRequirement: f.need,
          additionalInfo: f.notes || undefined,
          patientCountry: f.country || undefined,
          patientAge: Number.isFinite(age) ? age : undefined,
          requiredDocuments: this.docs(),
        })
        .subscribe({
          next: (detail) => {
            this.reset();
            resolve(detail.id);
          },
          error: (err: HttpErrorResponse) => {
            this.submitError.set(err.error?.message ?? 'Could not submit this request. Please try again.');
            reject(err);
          },
        });
    });
  }

  private reset(): void {
    this.loadedKind = null;
    this.loadedId = null;
    this.state.set('idle');
    this.record.set(null);
    this.form.set({ ...EMPTY_BOOKING_FORM });
    this.formErrors.set({});
    this.docs.set([]);
    this.submitError.set(null);
  }
}
