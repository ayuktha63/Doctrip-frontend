import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DoctorsService } from '../doctors.service';
import { Doctor, isPubliclyVisible } from '../doctor.model';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * FE-WEB-2.6 — Public Doctor Discovery and Listing.
 * FE-WEB-2.7 — Doctor Search.
 *
 * Scope boundary: this component lists/searches doctors and lets a
 * visitor select one. It does not implement doctor profile/details
 * (FE-WEB-2.8), booking, login/signup, authentication handoff, or
 * discovery-context preservation — those are later subtasks. No
 * additional filters are added: story_2.md leaves "search/filter
 * requirements not confirmed" as TBD, and Story_2_Subtasks.md explicitly
 * excludes filters from FE-WEB-2.7.
 */
@Component({
  selector: 'app-doctor-list',
  imports: [],
  templateUrl: './doctor-list.html',
  styleUrl: './doctor-list.scss',
})
export class DoctorList {
  private readonly doctorsService = inject(DoctorsService);
  private readonly router = inject(Router);

  private readonly state = signal<LoadState>('loading');
  private readonly doctors = signal<Doctor[]>([]);
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
  readonly visibleDoctors = computed(() => this.doctors().filter(isPubliclyVisible));

  readonly isEmpty = computed(
    () => this.state() === 'loaded' && this.visibleDoctors().length === 0,
  );

  readonly currentError = this.errorMessage.asReadonly();

  // Purely structural — a fixed count of skeleton placeholder rows shown
  // while loading (visual only, not doctor data).
  readonly skeletonRows = [0, 1, 2];

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.errorMessage.set(null);

    const query = this.searchQuery().trim();
    const request$ = query ? this.doctorsService.searchDoctors(query) : this.doctorsService.getDoctors();

    request$.subscribe({
      next: (doctors) => {
        this.doctors.set(doctors);
        this.state.set('loaded');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.state.set('error');
      },
    });
  }

  // story_2.md: "Visitor/Patient can search doctors on Website" — search
  // must not require authentication (no auth call is made here; it
  // reuses the same public DoctorsService as listing).
  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.load();
  }

  // Selection affordance only (story_2.md: "Visitor/Patient can select a
  // doctor"). Navigating to a doctor's detail route is wired here, but
  // the destination view itself is out of scope for FE-WEB-2.6/2.7 and
  // is implemented in FE-WEB-2.8.
  selectDoctor(doctor: Doctor): void {
    this.router.navigate(['/doctors', doctor.id]);
  }
}
