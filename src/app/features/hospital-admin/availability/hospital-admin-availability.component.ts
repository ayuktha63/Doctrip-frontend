import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HospitalAdminAvailabilityService } from '../../../core/services/hospital-admin-availability.service';
import { HospitalAdminDoctorService } from '../../../core/services/hospital-admin-doctor.service';
import { ToastService } from '../../../core/services/toast.service';
import { AvailabilitySlot, Doctor } from '../../../core/models/hospital-admin.model';
import { ApiError } from '../../../core/models/auth.model';

/**
 * Per-doctor weekly availability. No edit/PUT exists on the backend — only add (POST) and remove
 * (DELETE), matching the mockup exactly (no edit affordance is built here). A 409 from POST means
 * the new slot overlaps an existing one for that doctor/date; the mockup's conflict callout style
 * (`.dt-note-err`) is reproduced with a "Drop the overlap" action that deletes the offending slot
 * and retries the add.
 */
@Component({
  selector: 'app-hospital-admin-availability',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hospital-admin-availability.component.html',
})
export class HospitalAdminAvailabilityComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HospitalAdminAvailabilityService);
  private readonly doctorService = inject(HospitalAdminDoctorService);
  private readonly toast = inject(ToastService);
  private readonly route = inject(ActivatedRoute);

  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly selectedDoctorId = signal<string>('');
  protected readonly slots = signal<AvailabilitySlot[]>([]);
  protected readonly loading = signal(false);
  protected readonly conflictErr = signal('');
  protected readonly saving = signal(false);
  protected readonly pendingPayload = signal<ReturnType<typeof this.form.getRawValue> | null>(null);
  protected readonly showForm = signal(false);

  /** A deterministic color per doctor id, matching the mockup's colored dot on each doctor chip. */
  private static readonly DOT_PALETTE = ['#0F62D6', '#B42318', '#6D28D9', '#0E7C4A', '#D97706', '#0D9488', '#DB2777'];

  protected readonly form = this.fb.nonNullable.group({
    slotDate: ['', Validators.required],
    startTime: ['', Validators.required],
    endTime: ['', Validators.required],
    kind: ['OP consults', Validators.required],
  });

  /** Monday of the week currently shown in the grid — starts on the week containing today. */
  protected readonly weekStart = signal<Date>(HospitalAdminAvailabilityComponent.mondayOf(new Date()));

  private static mondayOf(d: Date): Date {
    const copy = new Date(d);
    const day = copy.getDay(); // 0 = Sunday
    const diff = day === 0 ? -6 : 1 - day;
    copy.setDate(copy.getDate() + diff);
    copy.setHours(0, 0, 0, 0);
    return copy;
  }

  /** Local-calendar "YYYY-MM-DD" — NOT toISOString(), which converts to UTC and silently shifts
   *  the date back a day in any positive-offset timezone (e.g. IST), causing a slot saved for
   *  e.g. Sept 20 to render under the Sept 19 grid column and look like a false conflict. */
  private static toIsoDate(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  protected readonly weekLabel = computed(() => {
    const start = this.weekStart();
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
    return `Week of ${fmt(start)} – ${fmt(end)}, ${end.getFullYear()}`;
  });

  /** The visible week's 7 days, each with the slots that fall on it (sorted by start time). */
  protected readonly weekDays = computed(() => {
    const start = this.weekStart();
    const all = this.slots();
    const days = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const iso = HospitalAdminAvailabilityComponent.toIsoDate(date);
      const daySlots = all
        .filter((s) => s.slotDate === iso)
        .slice()
        .sort((a, b) => a.startTime.localeCompare(b.startTime));
      days.push({
        iso,
        dow: date.toLocaleDateString(undefined, { weekday: 'short' }),
        dayNum: date.getDate(),
        slots: daySlots,
      });
    }
    return days;
  });

  /** Overlap conflicts among the currently-loaded slots (same date, overlapping time range) —
   *  purely a display hint; the backend is the real enforcement (409 on POST). */
  protected readonly clashingSlotIds = computed(() => {
    const clashing = new Set<string>();
    const byDate = new Map<string, AvailabilitySlot[]>();
    for (const s of this.slots()) {
      (byDate.get(s.slotDate) ?? byDate.set(s.slotDate, []).get(s.slotDate)!).push(s);
    }
    for (const daySlots of byDate.values()) {
      for (let i = 0; i < daySlots.length; i++) {
        for (let j = i + 1; j < daySlots.length; j++) {
          const a = daySlots[i];
          const b = daySlots[j];
          if (a.startTime < b.endTime && b.startTime < a.endTime) {
            clashing.add(a.id);
            clashing.add(b.id);
          }
        }
      }
    }
    return clashing;
  });

  /** The doctor the "Add availability" modal is currently adding a slot for. */
  protected readonly selectedDoctorName = computed(
    () => this.doctors().find((d) => d.id === this.selectedDoctorId())?.name ?? '',
  );

  dotFor(doctorId: string): string {
    const idx = this.doctors().findIndex((d) => d.id === doctorId);
    const palette = HospitalAdminAvailabilityComponent.DOT_PALETTE;
    return palette[idx >= 0 ? idx % palette.length : 0];
  }

  openAdd(): void {
    this.conflictErr.set('');
    this.form.reset({ slotDate: '', startTime: '', endTime: '', kind: 'OP consults' });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  ngOnInit(): void {
    this.doctorService.list().subscribe((list) => {
      this.doctors.set(list);
      const fromQuery = this.route.snapshot.queryParamMap.get('doctorId');
      const initial = fromQuery ?? list[0]?.id ?? '';
      if (initial) this.selectDoctor(initial);
    });
  }

  selectDoctor(doctorId: string): void {
    this.selectedDoctorId.set(doctorId);
    this.conflictErr.set('');
    this.pendingPayload.set(null);
    if (!doctorId) return;
    this.loading.set(true);
    this.service.list(doctorId).subscribe({
      next: (list) => {
        this.slots.set(list);
        this.loading.set(false);
        // Jump the visible week to this doctor's earliest slot, so seeded/existing data is
        // visible immediately instead of showing an empty grid for "this week".
        const earliest = list.map((s) => s.slotDate).sort()[0];
        if (earliest) {
          this.weekStart.set(HospitalAdminAvailabilityComponent.mondayOf(new Date(earliest + 'T00:00:00')));
        }
      },
      error: () => this.loading.set(false),
    });
  }

  addSlot(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const doctorId = this.selectedDoctorId();
    if (!doctorId) return;
    this.conflictErr.set('');
    this.saving.set(true);
    const payload = this.form.getRawValue();
    this.service.add(doctorId, payload).subscribe({
      next: (slot) => {
        this.saving.set(false);
        this.slots.set([...this.slots(), slot]);
        this.showForm.set(false);
        this.toast.show('Availability slot added.');
      },
      error: (err: { status: number; error?: ApiError }) => {
        this.saving.set(false);
        if (err.status === 409) {
          this.pendingPayload.set(payload);
          this.showForm.set(false);
          this.conflictErr.set(err.error?.message ?? 'This slot overlaps an existing one for this doctor and date.');
        } else {
          this.toast.show(err.error?.message ?? 'Could not add availability slot.');
        }
      },
    });
  }

  /** "Drop the overlap" — deletes the conflicting slot the backend flagged, then retries the add. */
  dropOverlap(conflicting: AvailabilitySlot): void {
    const doctorId = this.selectedDoctorId();
    const payload = this.pendingPayload();
    this.service.remove(doctorId, conflicting.id).subscribe({
      next: () => {
        this.slots.set(this.slots().filter((s) => s.id !== conflicting.id));
        this.conflictErr.set('');
        if (payload) {
          this.form.setValue(payload);
          this.addSlot();
        }
      },
      error: () => this.toast.show('Could not remove the conflicting slot.'),
    });
  }

  removeSlot(slot: AvailabilitySlot): void {
    const doctorId = this.selectedDoctorId();
    this.service.remove(doctorId, slot.id).subscribe({
      next: () => {
        this.slots.set(this.slots().filter((s) => s.id !== slot.id));
        this.toast.show('Availability slot removed.');
      },
      error: () => this.toast.show('Could not remove availability slot.'),
    });
  }

}
