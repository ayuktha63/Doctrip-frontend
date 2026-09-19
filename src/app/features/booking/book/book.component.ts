import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingRequestForm } from '../../../core/models/booking-request.model';
import { BookingRequestStateService, BookingSegment } from '../../../core/services/booking-request-state.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

interface BookField {
  key: keyof BookingRequestForm;
  label: string;
  ph: string;
  required?: boolean;
}

// `title`/`label` are translation keys, resolved via `| translate` at the point of use in
// book.component.html — not the strings themselves — so this data stays static while the display
// text follows the active language signal.
const SECTIONS: { title: string; fields: BookField[] }[] = [
  {
    title: 'book.section.requirement.title',
    fields: [
      { key: 'need', label: 'book.field.need', ph: 'Right knee replacement', required: true },
      { key: 'notes', label: 'book.field.notes', ph: 'Anything the hospital should know' },
    ],
  },
  {
    title: 'book.section.patient.title',
    fields: [
      { key: 'name', label: 'book.field.patientName', ph: 'John Mathew', required: true },
      { key: 'age', label: 'book.field.age', ph: '54', required: true },
      { key: 'country', label: 'book.field.country', ph: 'United Kingdom', required: true },
      { key: 'passport', label: 'book.field.passport', ph: 'GBR 5512847' },
      { key: 'companion', label: 'book.field.companion', ph: '1 companion' },
    ],
  },
];

/** Book appointment — the reference mockup's `isBook` screen (request form, date/time chips, documents). */
@Component({
  selector: 'app-booking-book',
  imports: [TranslatePipe],
  templateUrl: './book.component.html',
})
export class BookComponent implements OnInit {
  protected readonly state = inject(BookingRequestStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly sections = SECTIONS;
  private readonly kind = this.route.snapshot.paramMap.get('kind') as BookingSegment;
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly dateChips = computed(() =>
    this.state.days.map((d) => ({
      label: d.label,
      num: d.num,
      selected: this.state.day() === d.num,
    })),
  );

  protected readonly timeChips = computed(() =>
    this.state.times.map((t) => ({ label: t.label, selected: this.state.time() === t.label })),
  );

  ngOnInit(): void {
    this.state.ensureLoaded(this.kind, this.id);
  }

  fieldValue(key: keyof BookingRequestForm): string {
    return this.state.form()[key];
  }

  fieldError(key: keyof BookingRequestForm): string | undefined {
    return this.state.formErrors()[key];
  }

  onField(key: keyof BookingRequestForm, event: Event): void {
    this.state.setFormField(key, (event.target as HTMLInputElement | HTMLTextAreaElement).value);
  }

  pickDay(num: number): void {
    this.state.day.set(num);
  }

  pickTime(t: string): void {
    this.state.time.set(t);
  }

  addDoc(): void {
    this.state.addDoc();
  }

  removeDoc(i: number): void {
    this.state.removeDoc(i);
  }

  backToDiscovery(): void {
    this.router.navigate(['/discover']);
  }

  goReview(): void {
    if (!this.state.validate()) return;
    this.router.navigate(['/booking', this.kind, this.id, 'review']);
  }
}
