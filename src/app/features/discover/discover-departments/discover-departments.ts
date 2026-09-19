import { Component, computed, inject, input, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { DepartmentsService } from '../../departments/departments.service';
import { DepartmentDetail, DepartmentSummary } from '../../departments/department.model';
import { initialsFromName, subFor, metaFor, formatPrice } from '../discover.types';
import { TreatmentPackage } from '../../treatments/treatment-package.model';
import { Doctor } from '../../doctors/doctor.model';
import { Hospital } from '../../hospitals/hospital.model';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * "Departments" discover tab — a browse-then-drill-in screen (tile grid of real departments,
 * drilling into the Treatments/Consultants/Hospitals filed under one), matching the reference
 * mockup's shape (docs/"doctrip-web-panels 2.html", Departments tab). Unlike the other 3 tabs,
 * this isn't a grid of individually bookable records with their own detail route — selecting a
 * tile just reveals grouped lists in place; each item within those groups links into the existing
 * `discover-detail` route for that record (`/discover/{treatments|doctors|hospitals}/{id}`), so
 * the (now selection-gated) booking flow built there is reused unchanged.
 *
 * Data boundary: every field (name, counts, hospital names, the drill-in lists) comes from the
 * confirmed `DepartmentsService` contract — nothing here is a fabricated icon/blurb catalog like
 * the mockup's own hardcoded one; only a fixed, deterministic tint/accent palette (a design
 * choice, not per-record data, same posture as `KIND_CONFIG` in discover.types.ts).
 */
@Component({
  selector: 'app-discover-departments',
  imports: [],
  templateUrl: './discover-departments.html',
  styleUrl: './discover-departments.scss',
})
export class DiscoverDepartments {
  private readonly departmentsService = inject(DepartmentsService);
  private readonly router = inject(Router);

  /** Shared with the other 3 tabs' search box (discover-home.html passes its own `query()`
   *  signal in) — filtered client-side here since the whole department list is already loaded,
   *  the same reasoning Treatments already uses for its own client-side filter. */
  readonly query = input('');

  private readonly listState = signal<LoadState>('loading');
  private readonly departments = signal<DepartmentSummary[]>([]);
  private readonly listError = signal<string | null>(null);

  private readonly detailState = signal<LoadState | null>(null);
  private readonly detail = signal<DepartmentDetail | null>(null);
  private readonly detailError = signal<string | null>(null);

  readonly isLoading = computed(() => this.listState() === 'loading');
  readonly hasError = computed(() => this.listState() === 'error');
  readonly currentError = this.listError.asReadonly();

  readonly items = computed(() => {
    const q = this.query().trim().toLowerCase();
    const all = this.departments();
    if (!q) return all;
    return all.filter(
      (d) => d.name.toLowerCase().includes(q) || (this.blurbFor(d.name) ?? '').toLowerCase().includes(q),
    );
  });

  readonly isEmpty = computed(() => this.listState() === 'loaded' && this.items().length === 0);
  readonly isSearching = computed(() => this.query().trim().length > 0);

  readonly isOpen = computed(() => this.detailState() !== null);
  readonly isDetailLoading = computed(() => this.detailState() === 'loading');
  readonly hasDetailError = computed(() => this.detailState() === 'error');
  readonly currentDetailError = this.detailError.asReadonly();
  readonly openDepartment = this.detail.asReadonly();

  // Icon/tint/accent for the 9 departments the reference mockup itself defines (real SVG path
  // data copied from docs/"doctrip-web-panels 2.html"'s own `this.departments` catalog, not
  // invented here) — matched by exact department name. A real department name the backend
  // returns that isn't one of these 9 falls back to a plain letter badge from a fixed,
  // deterministic palette (PALETTE below) rather than guessing an icon for it.
  private static readonly ICONS: Readonly<Record<string, { tint: string; accent: string; icon: string; blurb: string }>> = {
    Cardiology: {
      tint: '#FBECEA',
      accent: '#B42318',
      icon: 'M12 20.2S3.6 14.7 3.6 9.1a4.7 4.7 0 0 1 8.4-2.9 4.7 4.7 0 0 1 8.4 2.9c0 5.6-8.4 11.1-8.4 11.1z M4.7 10.9h3.2l1.5-2.7 2.2 4.8 1.5-3 1 .9h5.2',
      blurb: 'Bypass, angioplasty, valve repair and heart-failure management.',
    },
    Oncology: {
      tint: '#F0EAFB',
      accent: '#6D28D9',
      icon: 'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8z M12 8.9a3.1 3.1 0 1 0 0 6.2 3.1 3.1 0 0 0 0-6.2z M12 1.6v3 M12 19.4v3 M1.6 12h3 M19.4 12h3',
      blurb: 'Screening, chemotherapy, surgical oncology and survivorship care.',
    },
    Orthopaedics: {
      tint: '#E7EFFC',
      accent: '#0F62D6',
      icon: 'M12 2.8v18.4 M8.8 4.6h6.4 M8.2 8.4h7.6 M8.2 12.2h7.6 M8.8 16h6.4 M9.6 19.4h4.8',
      blurb: 'Joint replacement, spine surgery and sports injury rehabilitation.',
    },
    Neurology: {
      tint: '#EEF0FE',
      accent: '#4F46E5',
      icon: 'M12 4.4C10.6 3.2 8 3.4 6.6 5c-.7.8-1 1.7-.8 2.6C3.9 8.2 3.1 10 4 11.4c-1.1 1.1-1 3 .5 3.9-.1 2 1.6 3.7 3.6 3.5H12Z M12 4.4C13.4 3.2 16 3.4 17.4 5c.7.8 1 1.7.8 2.6 1.9.6 2.7 2.4 1.8 3.8 1.1 1.1 1 3-.5 3.9.1 2-1.6 3.7-3.6 3.5H12Z M12 4.4v14.5 M12 18.9v1.9 M8.6 8.1c1.3.3 2 1.5 1.8 2.8 M15.4 8.1c-1.3.3-2 1.5-1.8 2.8 M6.9 13c1.5-.1 2.7.9 2.9 2.3 M17.1 13c-1.5-.1-2.7.9-2.9 2.3',
      blurb: 'Tumour and skull-base surgery, stroke care and epilepsy clinics.',
    },
    'Fertility and IVF': {
      tint: '#FDECF3',
      accent: '#DB2777',
      icon: 'M14.8 8a5.9 5.9 0 1 0 0 11.8 5.9 5.9 0 0 0 0-11.8z M14.8 11.5a2.4 2.4 0 1 0 0 4.8 2.4 2.4 0 0 0 0-4.8z M7.2 4.6a1.8 1.8 0 1 0 0 3.6 1.8 1.8 0 0 0 0-3.6z M5.5 5.2C4.3 4 3 4.3 2.6 5.3c-.4 1 .5 1.9 1.4 1.5',
      blurb: 'IVF and ICSI cycles, fertility preservation and counselling.',
    },
    Gastroenterology: {
      tint: '#FEF3E2',
      accent: '#D97706',
      icon: 'M11.4 2.8v3.4 M11.4 6.2c-3.3.5-5.6 3.1-5.6 6.4a6 6 0 0 0 6 6c3.2 0 5.6-2.1 6-5.1.3-2.5-.8-4.7-2.9-5.9-.8-.5-1.4-1-1.5-1.4 M9.3 10.6c1.5 1.7 3.4 2.6 5.7 2.6 M9.9 14.4c1.4 1.1 3 1.6 4.9 1.6',
      blurb: 'Therapeutic endoscopy, liver clinics and inflammatory bowel disease.',
    },
    'Cosmetic surgery': {
      tint: '#E6F6F6',
      accent: '#0D9488',
      icon: 'M16.6 20.9v-2.3c0-1.2.5-2.3 1.4-3.1A7.9 7.9 0 0 0 12.4 3.2 7.9 7.9 0 0 0 4.8 9.5l-1.4 3.3a.7.7 0 0 0 .6 1h1.7v2.4a2.4 2.4 0 0 0 2.4 2.4h1.4v2.3 M9.5 9.9h.02 M14.6 9.9h.02',
      blurb: 'Aesthetic and reconstructive surgery with photographic planning.',
    },
    'Dental care': {
      tint: '#E4F2FB',
      accent: '#0284C7',
      icon: 'M12 3.8c-1.9 0-2.4-.9-4.1-.9-2 0-3.2 1.8-3.2 4.4 0 2.5.9 3.5 1.6 6 .4 2.2.5 4.8 2.1 4.8s1.5-3.4 2.5-5.3c.4-.9 2.2-.9 2.6 0 1 1.9 1 5.3 2.5 5.3s1.7-2.6 2.1-4.8c.7-2.5 1.6-3.5 1.6-6 0-2.6-1.2-4.4-3.2-4.4-1.7 0-2.2.9-4.1.9z',
      blurb: 'Implants, full-mouth rehabilitation and oral surgery.',
    },
    'Eye care': {
      tint: '#E6F4EC',
      accent: '#0E7C4A',
      icon: 'M2.6 12s3.6-6.6 9.4-6.6S21.4 12 21.4 12s-3.6 6.6-9.4 6.6S2.6 12 2.6 12z M12 9.1a2.9 2.9 0 1 0 0 5.8 2.9 2.9 0 0 0 0-5.8z',
      blurb: 'Cataract and refractive surgery, LASIK and medical retina.',
    },
  };

  private static readonly PALETTE: readonly { tint: string; accent: string }[] = [
    { tint: '#FBECEA', accent: '#B42318' },
    { tint: '#EAF1FE', accent: '#1A6DF0' },
    { tint: '#E7F6EC', accent: '#16A34A' },
    { tint: '#F1EAFE', accent: '#7C3AED' },
    { tint: '#FDF3E3', accent: '#B45309' },
    { tint: '#E3F2F1', accent: '#0D726D' },
  ];

  constructor() {
    this.load();
  }

  load(): void {
    this.listState.set('loading');
    this.listError.set(null);
    this.departmentsService.list().subscribe({
      next: (departments) => {
        this.departments.set(departments);
        this.listState.set('loaded');
      },
      error: (err: HttpErrorResponse) => {
        this.listError.set(err.error?.message ?? err.message);
        this.listState.set('error');
      },
    });
  }

  paletteFor(name: string): { tint: string; accent: string } {
    const known = DiscoverDepartments.ICONS[name];
    if (known) return known;
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    }
    return DiscoverDepartments.PALETTE[hash % DiscoverDepartments.PALETTE.length];
  }

  /** Real mockup SVG path data for a known department name, or null to fall back to the plain
   *  letter badge (never guesses an icon for a department the mockup didn't define). */
  iconFor(name: string): string | null {
    return DiscoverDepartments.ICONS[name]?.icon ?? null;
  }

  /** Real mockup blurb text for a known department name, or null (no fabricated description for
   *  a department the mockup's own catalog doesn't cover). */
  blurbFor(name: string): string | null {
    return DiscoverDepartments.ICONS[name]?.blurb ?? null;
  }

  priceMeta(dept: DepartmentSummary): string {
    if (dept.fromPrice == null) return 'On request';
    return 'From ' + formatPrice(dept.fromPrice);
  }

  open(name: string): void {
    this.detailState.set('loading');
    this.detailError.set(null);
    this.departmentsService.getByName(name).subscribe({
      next: (department) => {
        this.detail.set(department);
        this.detailState.set('loaded');
      },
      error: (err: HttpErrorResponse) => {
        this.detailError.set(err.error?.message ?? err.message);
        this.detailState.set('error');
      },
    });
  }

  close(): void {
    this.detailState.set(null);
    this.detail.set(null);
  }

  // Each item within a department's Treatments/Consultants/Hospitals group renders as the same
  // kind of tile the main Treatments/Hospitals/Doctors tabs use (badge, sub, blurb, price/
  // experience/rating meta, "View details") — reusing the exact same shared helpers so the two
  // presentations of the same record never drift apart.
  itemBadge(name: string): string {
    return initialsFromName(name);
  }

  treatmentSub(t: TreatmentPackage): string | undefined {
    return subFor('Treatments', t);
  }

  treatmentMeta(t: TreatmentPackage): string | undefined {
    return metaFor('Treatments', t);
  }

  doctorSub(d: Doctor): string | undefined {
    return subFor('Doctors', d);
  }

  doctorMeta(d: Doctor): string | undefined {
    return metaFor('Doctors', d);
  }

  hospitalSub(h: Hospital): string | undefined {
    return subFor('Hospitals', h);
  }

  hospitalMeta(h: Hospital): string | undefined {
    return metaFor('Hospitals', h);
  }

  viewTreatment(id: number): void {
    this.router.navigate(['/discover', 'treatments', String(id)]);
  }

  viewDoctor(id: number): void {
    this.router.navigate(['/discover', 'doctors', String(id)]);
  }

  viewHospital(id: number): void {
    this.router.navigate(['/discover', 'hospitals', String(id)]);
  }
}
