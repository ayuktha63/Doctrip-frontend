import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DoctorsService } from '../doctors.service';
import { Doctor, isPubliclyVisible } from '../doctor.model';

type LoadState = 'loading' | 'loaded' | 'unavailable' | 'error';

/**
 * FE-WEB-2.8 — Doctor Details/Profile.
 *
 * Scope boundary: this component displays an approved doctor's profile
 * information. It does not implement booking, login/signup,
 * authentication handoff (FE-WEB-2.9+), or discovery-context
 * preservation — those are later subtasks. No booking/proceed action is
 * added here: story_2.md and Story_2_Subtasks.md's FE-WEB-2.8 breakdown
 * only require displaying profile information, not a booking affordance.
 */
@Component({
  selector: 'app-doctor-detail',
  imports: [],
  templateUrl: './doctor-detail.html',
  styleUrl: './doctor-detail.scss',
})
export class DoctorDetail {
  private readonly route = inject(ActivatedRoute);
  private readonly doctorsService = inject(DoctorsService);

  private readonly state = signal<LoadState>('loading');
  private readonly doctor = signal<Doctor | null>(null);
  private readonly errorMessage = signal<string | null>(null);

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasError = computed(() => this.state() === 'error');
  readonly isUnavailable = computed(() => this.state() === 'unavailable');
  readonly isLoaded = computed(() => this.state() === 'loaded');

  readonly profile = this.doctor.asReadonly();
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

    this.doctorsService.getDoctorById(id).subscribe({
      next: (result) => {
        this.doctor.set(result);
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
