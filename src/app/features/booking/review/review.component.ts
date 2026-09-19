import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingRequestStateService, BookingSegment } from '../../../core/services/booking-request-state.service';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

/** Review — the reference mockup's `isReview` screen (summary of the request, submit or edit). */
@Component({
  selector: 'app-booking-review',
  imports: [TranslatePipe],
  templateUrl: './review.component.html',
})
export class ReviewComponent implements OnInit {
  protected readonly state = inject(BookingRequestStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly kind = this.route.snapshot.paramMap.get('kind') as BookingSegment;
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly hospitalName = computed(() => this.state.record()?.hospital ?? 'The hospital');

  // `title`/`k` values below are translation keys, resolved via `| translate` in
  // review.component.html — not the display strings themselves.
  protected readonly groups = computed(() => {
    const record = this.state.record();
    const f = this.state.form();
    const docs = this.state.docs();
    return [
      {
        title: 'book.section.requirement.title',
        rows: [
          { k: 'review.row.requirement', v: f.need },
          { k: 'book.field.notes', v: f.notes || '—' },
        ],
      },
      {
        title: 'review.section.whereAndWho',
        rows: [
          { k: 'review.row.hospital', v: record?.hospital ?? '—' },
          { k: 'review.row.department', v: record?.dept ?? '—' },
          { k: 'appointments.doctor', v: record?.doctor ?? '—' },
          { k: 'review.row.documents', v: `${docs.length}` },
        ],
      },
      {
        title: 'review.section.patientAndSlot',
        rows: [
          { k: 'review.row.patient', v: `${f.name}, ${f.age}` },
          { k: 'book.field.country', v: f.country },
          { k: 'book.field.passport', v: f.passport || '—' },
          { k: 'review.row.preferredSlot', v: this.state.whenLabel() },
        ],
      },
    ];
  });

  ngOnInit(): void {
    if (this.state.state() !== 'loaded') {
      this.router.navigate(['/booking', this.kind, this.id]);
    }
  }

  goBook(): void {
    this.router.navigate(['/booking', this.kind, this.id]);
  }

  protected readonly submitError = this.state.submitError;
  protected readonly submitting = signal(false);

  submitRequest(): void {
    this.submitting.set(true);
    this.state
      .submit()
      .then((id) => this.router.navigate(['/appointments', id]))
      .catch(() => {})
      .finally(() => this.submitting.set(false));
  }
}
