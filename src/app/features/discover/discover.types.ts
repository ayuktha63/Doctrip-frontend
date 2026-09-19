import { TreatmentPackage } from '../treatments/treatment-package.model';
import { Hospital } from '../hospitals/hospital.model';
import { Doctor, TeamMember } from '../doctors/doctor.model';

/**
 * Story 2 — Healthcare Discovery, unified page.
 *
 * Visual reference: docs/"doctrip-web-panels 2.html" (PatientPanel.dc.html
 * artboard) — the actual website mockup. Its "Discover" screen is ONE
 * page with a single search box, a `['Treatments', 'Hospitals',
 * 'Doctors']` tab switcher over one shared card grid, and ONE detail
 * template used for whichever kind of record was opened.
 *
 * Every field used below (`sub`/`meta`/facts) is a real, confirmed
 * field from the live backend — verified directly against the running
 * API, not assumed. See treatment-package.model.ts / hospital.model.ts
 * / doctor.model.ts for the full confirmed shape of each.
 */
export type DiscoverKind = 'Treatments' | 'Hospitals' | 'Doctors';
export type DiscoverRecord = TreatmentPackage | Hospital | Doctor;

export const DISCOVER_KINDS: readonly DiscoverKind[] = ['Treatments', 'Hospitals', 'Doctors'];

/**
 * The Discover page's tab set, one wider than {@link DiscoverKind} — "Departments" is a
 * browse-then-drill-in tab (real data via `/api/public/departments`), not a card grid of
 * individually bookable records like the other three, so it isn't part of {@link DiscoverKind}
 * (which drives the shared card grid + `discover-detail` routing). Order matches the reference
 * mockup's tab order.
 */
export type DiscoverTab = 'Departments' | DiscoverKind;
export const DISCOVER_TABS: readonly DiscoverTab[] = ['Departments', 'Treatments', 'Hospitals', 'Doctors'];

export interface DiscoverKindConfig {
  label: DiscoverKind;
  urlSegment: 'treatments' | 'hospitals' | 'doctors';
  /** Booking-destination path segment, e.g. /booking/treatment/1. */
  bookingSegment: 'treatment' | 'hospital' | 'doctor';
  emptyHint: string;
  /**
   * Card/badge colors, one fixed pair per kind — a design choice (not
   * per-record data; the mockup's own catalog varies tint per record
   * using specialty data that isn't a distinct field on our records).
   */
  tint: string;
  accent: string;
}

export const KIND_CONFIG: Record<DiscoverKind, DiscoverKindConfig> = {
  Treatments: {
    label: 'Treatments',
    urlSegment: 'treatments',
    bookingSegment: 'treatment',
    emptyHint: 'Try a different treatment name.',
    tint: '#EAF1FE',
    accent: '#1A6DF0',
  },
  Hospitals: {
    label: 'Hospitals',
    urlSegment: 'hospitals',
    bookingSegment: 'hospital',
    emptyHint: 'Try a different hospital name.',
    tint: '#E7F6EC',
    accent: '#16A34A',
  },
  Doctors: {
    label: 'Doctors',
    urlSegment: 'doctors',
    bookingSegment: 'doctor',
    emptyHint: 'Try a different doctor name.',
    tint: '#F1EAFE',
    accent: '#7C3AED',
  },
};

export function kindByUrlSegment(segment: string): DiscoverKind | undefined {
  return DISCOVER_KINDS.find((kind) => KIND_CONFIG[kind].urlSegment === segment);
}

/**
 * Card badge initials, computed from the record's own real `name` — the
 * same transform the mockup itself uses for its "Departments and
 * consultants" team initials (strips a leading "Dr." then takes the
 * first letter of each remaining word), not a fabricated value.
 */
export function initialsFromName(name: string): string {
  const cleaned = name.replace(/^Dr\.\s*/, '').trim();
  const initials = cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('');
  return initials.toUpperCase() || '?';
}

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

export function formatPrice(price: number): string {
  return inrFormatter.format(price);
}

/** Card/sidebar meta form — mirrors the mockup's `c.meta`/`sel.meta` for hospitals: "4.8 ★". */
export function formatRatingMeta(rating: number): string {
  return `${rating.toFixed(1)} ★`;
}

/** Facts-grid form — mirrors the mockup's facts tuple: "4.8 (512 reviews)". */
export function formatRatingFact(rating: number, reviewCount?: number): string {
  const value = rating.toFixed(1);
  return reviewCount != null ? `${value} (${reviewCount} reviews)` : value;
}

export function formatExperience(years: number): string {
  return `${years} ${years === 1 ? 'year' : 'years'}`;
}

/** Card subtitle — mirrors the mockup's `c.sub` per kind, real fields only. */
export function subFor(kind: DiscoverKind, record: DiscoverRecord): string | undefined {
  switch (kind) {
    case 'Treatments': {
      const r = record as TreatmentPackage;
      return [r.department, r.hospitalName].filter(Boolean).join(' · ') || undefined;
    }
    case 'Hospitals': {
      const r = record as Hospital;
      return [r.type, r.city].filter(Boolean).join(' · ') || undefined;
    }
    case 'Doctors': {
      const r = record as Doctor;
      return [r.specialty, r.hospitalName].filter(Boolean).join(' · ') || undefined;
    }
  }
}

/** Card/sidebar meta value — mirrors the mockup's `c.meta`/`sel.meta` per kind. */
export function metaFor(kind: DiscoverKind, record: DiscoverRecord): string | undefined {
  switch (kind) {
    case 'Treatments': {
      const r = record as TreatmentPackage;
      return r.price != null ? formatPrice(r.price) : undefined;
    }
    case 'Hospitals': {
      const r = record as Hospital;
      return r.rating != null ? formatRatingMeta(r.rating) : undefined;
    }
    case 'Doctors': {
      const r = record as Doctor;
      return r.experienceYears != null ? formatExperience(r.experienceYears) : undefined;
    }
  }
}

export interface DetailFact {
  key: string;
  value: string;
}

/** "About" card's facts grid — mirrors the mockup's `sel.facts`, real fields only. */
export function factsFor(kind: DiscoverKind, record: DiscoverRecord): DetailFact[] {
  const facts: DetailFact[] = [];
  switch (kind) {
    case 'Treatments': {
      const r = record as TreatmentPackage;
      if (r.department) facts.push({ key: 'Department', value: r.department });
      if (r.typicalStay) facts.push({ key: 'Typical stay', value: r.typicalStay });
      if (r.price != null) facts.push({ key: 'Package from', value: formatPrice(r.price) });
      if (r.hospitalName) facts.push({ key: 'Hospital', value: r.hospitalName });
      // hospitalCity/hospitalAccreditation aren't in the confirmed
      // TreatmentPackageDetailDto yet (they live on the linked Hospital,
      // not copied onto the treatment) — render only if/when the
      // backend adds them, per the mockup's 6-fact treatment layout.
      if (r.hospitalCity) facts.push({ key: 'City', value: r.hospitalCity });
      if (r.hospitalAccreditation) facts.push({ key: 'Accreditation', value: r.hospitalAccreditation });
      break;
    }
    case 'Hospitals': {
      const r = record as Hospital;
      if (r.beds != null) facts.push({ key: 'Beds', value: String(r.beds) });
      // departmentCount isn't in the confirmed HospitalDetailDto yet.
      if (r.departmentCount != null) facts.push({ key: 'Departments', value: String(r.departmentCount) });
      if (r.rating != null) facts.push({ key: 'Rating', value: formatRatingFact(r.rating, r.reviewCount) });
      if (r.city) facts.push({ key: 'City', value: r.city });
      if (r.accreditation) facts.push({ key: 'Accreditation', value: r.accreditation });
      if (r.languages) facts.push({ key: 'Languages', value: r.languages });
      break;
    }
    case 'Doctors': {
      const r = record as Doctor;
      if (r.department) facts.push({ key: 'Department', value: r.department });
      if (r.experienceYears != null) facts.push({ key: 'Experience', value: formatExperience(r.experienceYears) });
      if (r.specialty) facts.push({ key: 'Speciality', value: r.specialty });
      if (r.hospitalName) facts.push({ key: 'Hospital', value: r.hospitalName });
      if (r.languages) facts.push({ key: 'Languages', value: r.languages });
      if (r.rating != null) facts.push({ key: 'Rating', value: formatRatingFact(r.rating, r.reviewCount) });
      break;
    }
  }
  return facts;
}

/**
 * Alteration to the mockup, per explicit product direction: a Doctor's own detail page should not
 * show a "Departments and consultants" section (it doesn't make sense to show a doctor their own
 * colleagues there) — Hospitals/Treatments keep it.
 */
export function teamFor(kind: DiscoverKind, record: DiscoverRecord): TeamMember[] {
  if (kind === 'Doctors') {
    return [];
  }
  return record.team ?? [];
}
