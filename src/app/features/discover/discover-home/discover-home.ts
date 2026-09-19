import { Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { TreatmentsService } from '../../treatments/treatments.service';
import { HospitalsService } from '../../hospitals/hospitals.service';
import { DoctorsService } from '../../doctors/doctors.service';
import {
  DiscoverKind,
  DiscoverRecord,
  DISCOVER_KINDS,
  KIND_CONFIG,
  initialsFromName,
  subFor,
  metaFor,
} from '../discover.types';
import { TranslatePipe } from '../../../shared/pipes/translate.pipe';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * Story 2 — Healthcare Discovery (unified "Discover" screen).
 *
 * Visual/structural reference: docs/"doctrip-web-panels 2.html"
 * (PatientPanel.dc.html) — one search box + `['Treatments', 'Hospitals',
 * 'Doctors']` tab switcher over one shared card grid.
 *
 * Data boundary: each tab is backed by the real, already-confirmed
 * per-kind service (TreatmentsService/HospitalsService/DoctorsService).
 * Hospitals and Doctors have a confirmed server-side search endpoint
 * (`?name=`); Treatments does not (story_2.md never mentions treatment
 * search, and Story_2_Subtasks.md's FE-WEB-2.1 breakdown doesn't add
 * one) — so the Treatments tab filters the already-loaded list
 * client-side on `name`/`description` instead of calling a guessed
 * endpoint.
 */
@Component({
  selector: 'app-discover-home',
  imports: [TranslatePipe],
  templateUrl: './discover-home.html',
  styleUrl: './discover-home.scss',
})
export class DiscoverHome {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly hospitalsService = inject(HospitalsService);
  private readonly doctorsService = inject(DoctorsService);

  readonly kinds = DISCOVER_KINDS;

  private readonly state = signal<LoadState>('loading');
  private readonly records = signal<DiscoverRecord[]>([]);
  private readonly errorMessage = signal<string | null>(null);
  private readonly tab = signal<DiscoverKind>(this.initialTab());
  private readonly searchQuery = signal('');

  readonly activeTab = this.tab.asReadonly();
  readonly query = this.searchQuery.asReadonly();
  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasError = computed(() => this.state() === 'error');
  readonly currentError = this.errorMessage.asReadonly();

  readonly visibleCards = computed(() => {
    const q = this.searchQuery().trim().toLowerCase();
    const items = this.records();
    if (!q || this.activeTab() !== 'Treatments') {
      // Hospitals/Doctors already come back search-filtered from the
      // backend when a query is active (see load()); Treatments with no
      // query shows everything as loaded.
      return items;
    }
    return items.filter(
      (item) => item.name.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q),
    );
  });

  readonly isEmpty = computed(() => this.state() === 'loaded' && this.visibleCards().length === 0);

  readonly emptyHint = computed(() => KIND_CONFIG[this.activeTab()].emptyHint);
  readonly badgeTint = computed(() => KIND_CONFIG[this.activeTab()].tint);
  readonly badgeAccent = computed(() => KIND_CONFIG[this.activeTab()].accent);

  // Purely structural — a fixed count of skeleton placeholder rows shown
  // while loading (visual only, not discovery data).
  readonly skeletonRows = [0, 1, 2, 3, 4, 5];

  constructor() {
    this.load();
  }

  private initialTab(): DiscoverKind {
    const fromQuery = this.route.snapshot.queryParamMap.get('tab');
    return (DISCOVER_KINDS as readonly string[]).includes(fromQuery ?? '')
      ? (fromQuery as DiscoverKind)
      : 'Treatments';
  }

  selectTab(kind: DiscoverKind): void {
    if (kind === this.tab()) {
      return;
    }
    this.tab.set(kind);
    this.load();
  }

  onSearchInput(value: string): void {
    this.searchQuery.set(value);
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.errorMessage.set(null);

    this.requestFor(this.activeTab()).subscribe({
      next: (records) => {
        this.records.set(records);
        this.state.set('loaded');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.state.set('error');
      },
    });
  }

  private requestFor(kind: DiscoverKind): Observable<DiscoverRecord[]> {
    const query = this.searchQuery().trim();
    switch (kind) {
      case 'Treatments':
        // No confirmed search endpoint for treatments — always fetch the
        // full list; visibleCards() filters it client-side.
        return this.treatmentsService.getTreatmentPackages();
      case 'Hospitals':
        return query ? this.hospitalsService.searchHospitals(query) : this.hospitalsService.getHospitals();
      case 'Doctors':
        return query ? this.doctorsService.searchDoctors(query) : this.doctorsService.getDoctors();
    }
  }

  badgeFor(record: DiscoverRecord): string {
    return initialsFromName(record.name);
  }

  subFor(record: DiscoverRecord): string | undefined {
    return subFor(this.activeTab(), record);
  }

  metaFor(record: DiscoverRecord): string | undefined {
    return metaFor(this.activeTab(), record);
  }

  open(record: DiscoverRecord): void {
    const segment = KIND_CONFIG[this.activeTab()].urlSegment;
    this.router.navigate(['/discover', segment, String(record.id)]);
  }
}
