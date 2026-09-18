import { Component, computed, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingRequestForm } from '../../../core/models/booking-request.model';
import { BookingRequestStateService, BookingSegment } from '../../../core/services/booking-request-state.service';

interface BookField {
  key: keyof BookingRequestForm;
  label: string;
  ph: string;
  required?: boolean;
}

const SECTIONS: { title: string; fields: BookField[] }[] = [
  {
    title: 'Healthcare requirement',
    fields: [
      { key: 'need', label: 'What do you need?', ph: 'Right knee replacement', required: true },
      { key: 'notes', label: 'Additional details', ph: 'Anything the hospital should know' },
    ],
  },
  {
    title: 'Patient and traveller',
    fields: [
      { key: 'name', label: 'Patient name', ph: 'John Mathew', required: true },
      { key: 'age', label: 'Age', ph: '54', required: true },
      { key: 'country', label: 'Country of residence', ph: 'United Kingdom', required: true },
      { key: 'passport', label: 'Passport number', ph: 'GBR 5512847' },
      { key: 'companion', label: 'Travelling with', ph: '1 companion' },
    ],
  },
];

/** Book appointment — the reference mockup's `isBook` screen (request form, date/time chips, documents). */
@Component({
  selector: 'app-booking-book',
  imports: [],
  templateUrl: './book.component.html',
  styleUrl: './book.component.scss',
})
export class BookComponent implements OnInit {
  protected readonly state = inject(BookingRequestStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  protected readonly sections = SECTIONS;
  private readonly kind = this.route.snapshot.paramMap.get('kind') as BookingSegment;
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly dateChips = computed(() =>
    this.state.days.map(([label, num]) => ({
      label,
      num,
      selected: this.state.day() === num,
    })),
  );

  protected readonly timeChips = computed(() =>
    this.state.times.map((t) => ({ label: t, selected: this.state.time() === t })),
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
