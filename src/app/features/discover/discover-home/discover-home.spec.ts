import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DiscoverHome } from './discover-home';
import { TreatmentsService } from '../../treatments/treatments.service';
import { HospitalsService } from '../../hospitals/hospitals.service';
import { DoctorsService } from '../../doctors/doctors.service';

describe('DiscoverHome', () => {
  function setup(
    services: {
      treatments?: Partial<TreatmentsService>;
      hospitals?: Partial<HospitalsService>;
      doctors?: Partial<DoctorsService>;
    } = {},
    initialTab: string | null = null,
  ) {
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      imports: [DiscoverHome],
      providers: [
        { provide: TreatmentsService, useValue: services.treatments ?? {} },
        { provide: HospitalsService, useValue: services.hospitals ?? {} },
        { provide: DoctorsService, useValue: services.doctors ?? {} },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(initialTab ? { tab: initialTab } : {}) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(DiscoverHome);
    fixture.detectChanges();
    return { fixture, navigate };
  }

  it('defaults to the Treatments tab and loads without requiring authentication', () => {
    const getTreatmentPackages = vi.fn(() => of([{ id: 1, name: 'Knee Replacement Package' }]));
    const { fixture } = setup({ treatments: { getTreatmentPackages } });
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('Treatments');
    expect(getTreatmentPackages).toHaveBeenCalled();
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.visibleCards().length).toBe(1);
  });

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject();
    const { fixture } = setup({ treatments: { getTreatmentPackages: () => pending.asObservable() as any } });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('shows the error state when discovery data cannot be loaded', () => {
    const { fixture } = setup({
      treatments: { getTreatmentPackages: () => throwError(() => new Error('backend unavailable')) },
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.hasError()).toBe(true);
    expect(fixture.componentInstance.currentError()).toBe('backend unavailable');
  });

  it('shows the empty state when there are no records', () => {
    const { fixture } = setup({ treatments: { getTreatmentPackages: () => of([]) } });
    fixture.detectChanges();
    expect(fixture.componentInstance.isEmpty()).toBe(true);
  });

  it('switching to the Hospitals tab calls HospitalsService and re-loads', () => {
    const getHospitals = vi.fn(() => of([{ id: 1, name: 'City Care Hospital' }]));
    const { fixture } = setup({
      treatments: { getTreatmentPackages: () => of([]) },
      hospitals: { getHospitals },
    });
    fixture.detectChanges();

    fixture.componentInstance.selectTab('Hospitals');
    fixture.detectChanges();

    expect(fixture.componentInstance.activeTab()).toBe('Hospitals');
    expect(getHospitals).toHaveBeenCalled();
    expect(fixture.componentInstance.visibleCards()[0].name).toBe('City Care Hospital');
  });

  it('switching to the Doctors tab calls DoctorsService', () => {
    const getDoctors = vi.fn(() => of([{ id: 1, name: 'Dr. Asha Menon' }]));
    const { fixture } = setup({
      treatments: { getTreatmentPackages: () => of([]) },
      doctors: { getDoctors },
    });
    fixture.detectChanges();

    fixture.componentInstance.selectTab('Doctors');
    fixture.detectChanges();

    expect(getDoctors).toHaveBeenCalled();
  });

  it('reads the initial tab from the returnUrl-style query param (e.g. "Back to discovery")', () => {
    const getHospitals = vi.fn(() => of([]));
    const { fixture } = setup({ hospitals: { getHospitals } }, 'Hospitals');
    fixture.detectChanges();
    expect(fixture.componentInstance.activeTab()).toBe('Hospitals');
    expect(getHospitals).toHaveBeenCalled();
  });

  describe('search', () => {
    it('filters the Treatments tab client-side (no confirmed treatment search endpoint)', () => {
      const getTreatmentPackages = vi.fn(() =>
        of([
          { id: 1, name: 'Knee Replacement Package', description: 'Orthopaedic surgery.' },
          { id: 2, name: 'Cancer Screening Package', description: 'Oncology panel.' },
        ]),
      );
      const { fixture } = setup({ treatments: { getTreatmentPackages } });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('knee');
      fixture.detectChanges();

      // Only the initial load — searching re-filters the already-loaded list client-side, no
      // second server call for treatments (there's no confirmed treatment search endpoint).
      expect(getTreatmentPackages).toHaveBeenCalledTimes(1);
      expect(fixture.componentInstance.visibleCards().length).toBe(1);
      expect(fixture.componentInstance.visibleCards()[0].name).toBe('Knee Replacement Package');
    });

    it('calls the confirmed server-side search endpoint for Hospitals', () => {
      const searchSpy = vi.fn(() => of([{ id: 1, name: 'Apollo' }]));
      const { fixture } = setup(
        { hospitals: { getHospitals: () => of([]), searchHospitals: searchSpy } },
        'Hospitals',
      );
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('apollo');
      fixture.detectChanges();

      expect(searchSpy).toHaveBeenCalledWith('apollo');
    });

    it('calls the confirmed server-side search endpoint for Doctors', () => {
      const searchSpy = vi.fn(() => of([{ id: 1, name: 'Dr. Menon' }]));
      const { fixture } = setup({ doctors: { getDoctors: () => of([]), searchDoctors: searchSpy } }, 'Doctors');
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('menon');
      fixture.detectChanges();

      expect(searchSpy).toHaveBeenCalledWith('menon');
    });

    it('shows an appropriate empty state when a search has no matches', () => {
      const { fixture } = setup({ treatments: { getTreatmentPackages: () => of([{ id: 1, name: 'Knee Package' }]) } });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('nonexistent');
      fixture.detectChanges();

      expect(fixture.componentInstance.isEmpty()).toBe(true);
    });

    it('typing while on the Departments tab does not trigger a background fetch for the last-active kind', () => {
      const getHospitals = vi.fn(() => of([]));
      const searchHospitals = vi.fn(() => of([]));
      const { fixture } = setup({ hospitals: { getHospitals, searchHospitals } }, 'Hospitals');
      fixture.detectChanges();
      expect(getHospitals).toHaveBeenCalledTimes(1);

      fixture.componentInstance.selectTab('Departments');
      fixture.componentInstance.onSearchInput('apollo');
      fixture.detectChanges();

      expect(fixture.componentInstance.query()).toBe('apollo');
      expect(getHospitals).toHaveBeenCalledTimes(1);
      expect(searchHospitals).not.toHaveBeenCalled();
    });
  });

  it('navigates toward the selected record on selection', () => {
    const { fixture, navigate } = setup({
      treatments: { getTreatmentPackages: () => of([{ id: 42, name: 'Package' }]) },
    });
    fixture.detectChanges();

    fixture.componentInstance.open({ id: 42, name: 'Package' });

    expect(navigate).toHaveBeenCalledWith(['/discover', 'treatments', '42']);
  });

  it('computes card badge initials from the real record name (not fabricated)', () => {
    const { fixture } = setup({ treatments: { getTreatmentPackages: () => of([]) } });
    expect(fixture.componentInstance.badgeFor({ id: 1, name: 'Dr. Asha Menon' })).toBe('AM');
    expect(fixture.componentInstance.badgeFor({ id: 2, name: 'City Care Hospital' })).toBe('CC');
  });

  describe('real card fields (confirmed backend contract)', () => {
    it('shows treatment department/hospital as sub and price as meta', () => {
      const { fixture } = setup({
        treatments: {
          getTreatmentPackages: () =>
            of([{ id: 1, name: 'Knee Replacement Surgery', department: 'Orthopaedics', hospitalName: 'Aster Medcity', price: 120000 }]),
        },
      });
      fixture.detectChanges();
      const record = fixture.componentInstance.visibleCards()[0];
      expect(fixture.componentInstance.subFor(record)).toBe('Orthopaedics · Aster Medcity');
      expect(fixture.componentInstance.metaFor(record)).toContain('1,20,000');
    });

    it('shows hospital type/city as sub and rating as meta', () => {
      const { fixture } = setup(
        { hospitals: { getHospitals: () => of([{ id: 1, name: 'Aster Medcity', type: 'Multi-speciality', city: 'Kochi, Kerala', rating: 4.8, reviewCount: 512 }]) } },
        'Hospitals',
      );
      fixture.detectChanges();
      const record = fixture.componentInstance.visibleCards()[0];
      expect(fixture.componentInstance.subFor(record)).toBe('Multi-speciality · Kochi, Kerala');
      expect(fixture.componentInstance.metaFor(record)).toBe('4.8 ★');
    });

    it('shows doctor specialty/hospital as sub and experience as meta', () => {
      const { fixture } = setup(
        { doctors: { getDoctors: () => of([{ id: 1, name: 'Dr. Vikram Pillai', specialty: 'Joint replacement', hospitalName: 'Aster Medcity', experienceYears: 18 }]) } },
        'Doctors',
      );
      fixture.detectChanges();
      const record = fixture.componentInstance.visibleCards()[0];
      expect(fixture.componentInstance.subFor(record)).toBe('Joint replacement · Aster Medcity');
      expect(fixture.componentInstance.metaFor(record)).toBe('18 years');
    });
  });
});
