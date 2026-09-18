import { Component, OnInit, computed, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingRequestStateService, BookingSegment } from '../../../core/services/booking-request-state.service';

/** Review — the reference mockup's `isReview` screen (summary of the request, submit or edit). */
@Component({
  selector: 'app-booking-review',
  imports: [],
  templateUrl: './review.component.html',
})
export class ReviewComponent implements OnInit {
  protected readonly state = inject(BookingRequestStateService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private readonly kind = this.route.snapshot.paramMap.get('kind') as BookingSegment;
  private readonly id = this.route.snapshot.paramMap.get('id') ?? '';

  protected readonly hospitalName = computed(() => this.state.record()?.hospital ?? 'The hospital');

  protected readonly groups = computed(() => {
    const record = this.state.record();
    const f = this.state.form();
    const docs = this.state.docs();
    return [
      {
        title: 'Healthcare requirement',
        rows: [
          { k: 'Requirement', v: f.need },
          { k: 'Additional details', v: f.notes || '—' },
        ],
      },
      {
        title: 'Where and who',
        rows: [
          { k: 'Hospital', v: record?.hospital ?? '—' },
          { k: 'Department', v: record?.dept ?? '—' },
          { k: 'Doctor', v: record?.doctor ?? '—' },
          { k: 'Documents', v: `${docs.length} attached` },
        ],
      },
      {
        title: 'Patient and preferred slot',
        rows: [
          { k: 'Patient', v: `${f.name}, ${f.age}` },
          { k: 'Country', v: f.country },
          { k: 'Passport', v: f.passport || '—' },
          { k: 'Preferred date and time', v: this.state.whenLabel() },
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

  submitRequest(): void {
    const id = this.state.submit();
    this.router.navigate(['/appointments', id]);
  }
}
