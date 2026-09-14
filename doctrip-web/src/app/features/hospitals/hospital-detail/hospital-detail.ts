import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HospitalsService } from '../hospitals.service';
import { Hospital, isPubliclyVisible } from '../hospital.model';

type LoadState = 'loading' | 'loaded' | 'unavailable' | 'error';

/**
 * FE-WEB-2.5 — Hospital Details/Profile.
 *
 * Scope boundary: this component displays an approved hospital's
 * profile information. It does not implement doctor discovery
 * (FE-WEB-2.6+), booking, login/signup, authentication handoff, or
 * discovery-context preservation — those are later subtasks. No
 * booking/proceed action is added here: story_2.md and
 * Story_2_Subtasks.md's FE-WEB-2.5 breakdown only require displaying
 * profile information, not a booking affordance.
 */
@Component({
  selector: 'app-hospital-detail',
  imports: [],
  templateUrl: './hospital-detail.html',
  styleUrl: './hospital-detail.scss',
})
export class HospitalDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly hospitalsService = inject(HospitalsService);

  private readonly state = signal<LoadState>('loading');
  private readonly hospital = signal<Hospital | null>(null);
  private readonly errorMessage = signal<string | null>(null);

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasError = computed(() => this.state() === 'error');
  readonly isUnavailable = computed(() => this.state() === 'unavailable');
  readonly isLoaded = computed(() => this.state() === 'loaded');

  readonly profile = this.hospital.asReadonly();
  readonly currentError = this.errorMessage.asReadonly();

  constructor() {
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.state.set('unavailable');
      return;
    }

    this.state.set('loading');
    this.errorMessage.set(null);

    this.hospitalsService.getHospitalById(id).subscribe({
      next: (result) => {
        this.hospital.set(result);
        // Business rule (story_2.md): only approved/published records
        // are shown; an inactive record follows the same visibility
        // rule as "unavailable" from the visitor's perspective. Also
        // covers "record becomes unavailable while viewing" if a
        // refreshed fetch returns a non-approved status.
        this.state.set(isPubliclyVisible(result) ? 'loaded' : 'unavailable');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.state.set('error');
      },
    });
  }
}
