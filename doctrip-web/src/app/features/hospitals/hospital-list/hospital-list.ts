import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HospitalsService } from '../hospitals.service';
import { Hospital, isPubliclyVisible } from '../hospital.model';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * FE-WEB-2.3 — Public Hospital Discovery and Listing.
 * FE-WEB-2.4 — Hospital Search.
 *
 * Scope boundary: this component lists/searches hospitals and lets a
 * visitor select one. It does not implement hospital profile/details
 * (FE-WEB-2.5), booking, login/signup, authentication handoff, or
 * discovery-context preservation — those are later subtasks. No
 * additional filters are added: story_2.md leaves "search/filter
 * requirements not confirmed" as TBD, and Story_2_Subtasks.md explicitly
 * excludes filters from FE-WEB-2.4.
 */
@Component({
  selector: 'app-hospital-list',
  imports: [],
  templateUrl: './hospital-list.html',
  styleUrl: './hospital-list.scss',
})
export class HospitalList {
  private readonly hospitalsService = inject(HospitalsService);
  private readonly router = inject(Router);

  private readonly state = signal<LoadState>('loading');
  private readonly hospitals = signal<Hospital[]>([]);
  private readonly errorMessage = signal<string | null>(null);
  private readonly searchQuery = signal('');

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasError = computed(() => this.state() === 'error');
  readonly query = this.searchQuery.asReadonly();
  readonly isSearchActive = computed(() => this.searchQuery().trim().length > 0);

  // Business rule (story_2.md): only approved/published records are
  // shown. Inactive/unapproved records are filtered out here as a
  // discovery-side safeguard; the authoritative filtering is expected
  // server-side once the backend contract exists.
  readonly visibleHospitals = computed(() => this.hospitals().filter(isPubliclyVisible));

  readonly isEmpty = computed(
    () => this.state() === 'loaded' && this.visibleHospitals().length === 0,
  );

  readonly currentError = this.errorMessage.asReadonly();

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.errorMessage.set(null);

    const query = this.searchQuery().trim();
    const request$ = query ? this.hospitalsService.searchHospitals(query) : this.hospitalsService.getHospitals();

    request$.subscribe({
      next: (hospitals) => {
        this.hospitals.set(hospitals);
        this.state.set('loaded');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.state.set('error');
      },
    });
  }

  // story_2.md: "Visitor/Patient can search hospitals on Website" —
  // search must not require authentication (no auth call is made here;
  // it reuses the same public HospitalsService as listing).
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.load();
  }

  // Selection affordance only (story_2.md: "Visitor/Patient can select a
  // hospital"). Navigating to a hospital's detail route is wired here,
  // but the destination view itself is out of scope for FE-WEB-2.3/2.4
  // and is implemented in FE-WEB-2.5.
  selectHospital(hospital: Hospital): void {
    this.router.navigate(['/hospitals', hospital.id]);
  }
}
