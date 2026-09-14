import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { HospitalList } from './hospital-list';
import { HospitalsService } from '../hospitals.service';
import { Hospital } from '../hospital.model';

describe('HospitalList', () => {
  function setup(service: Partial<HospitalsService>) {
    TestBed.configureTestingModule({
      imports: [HospitalList],
      providers: [
        { provide: HospitalsService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(HospitalList);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject<Hospital[]>();
    const fixture = setup({ getHospitals: () => pending.asObservable() });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('shows the empty state when there are no approved hospitals', () => {
    const fixture = setup({ getHospitals: () => of([]) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isEmpty()).toBe(true);
    expect(component.visibleHospitals().length).toBe(0);
  });

  it('shows only approved hospitals and filters out inactive ones', () => {
    const hospitals: Hospital[] = [
      { id: '1', name: 'Approved Hospital', status: 'approved' },
      { id: '2', name: 'Inactive Hospital', status: 'inactive' },
    ];
    const fixture = setup({ getHospitals: () => of(hospitals) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.visibleHospitals().length).toBe(1);
    expect(component.visibleHospitals()[0].id).toBe('1');
  });

  it('shows the error state when discovery data cannot be loaded', () => {
    const fixture = setup({
      getHospitals: () => throwError(() => new Error('backend unavailable')),
    });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.hasError()).toBe(true);
    expect(component.currentError()).toBe('backend unavailable');
  });

  it('navigates toward the selected hospital on selection', () => {
    const hospitals: Hospital[] = [{ id: '42', name: 'Hospital', status: 'approved' }];
    const fixture = setup({ getHospitals: () => of(hospitals) });
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    fixture.componentInstance.selectHospital(hospitals[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/hospitals', '42']);
  });

  it('does not require authentication to load (public discovery)', () => {
    const fixture = setup({ getHospitals: () => of([{ id: '1', name: 'Hospital', status: 'approved' }]) });
    fixture.detectChanges();
    // No auth-related provider/token is required for the component to
    // construct and load successfully — asserting successful load here
    // confirms no auth dependency was introduced.
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.visibleHospitals().length).toBe(1);
  });

  describe('FE-WEB-2.4 — Hospital Search', () => {
    it('searches via HospitalsService without requiring authentication', () => {
      const searchSpy = vi.fn(() => of([{ id: '1', name: 'Apollo', status: 'approved' } as Hospital]));
      const fixture = setup({ getHospitals: () => of([]), searchHospitals: searchSpy });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('apollo');
      fixture.detectChanges();

      // No auth token/header is passed — the stub signature takes only
      // the query string, confirming no auth dependency was introduced.
      expect(searchSpy).toHaveBeenCalledWith('apollo');
    });

    it('displays matching hospital results for a search query', () => {
      const fixture = setup({
        getHospitals: () => of([]),
        searchHospitals: () => of([{ id: '1', name: 'Apollo Hospital', status: 'approved' }]),
      });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('apollo');
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.isSearchActive()).toBe(true);
      expect(component.visibleHospitals().length).toBe(1);
      expect(component.visibleHospitals()[0].name).toBe('Apollo Hospital');
    });

    it('shows an appropriate empty state when a search has no matching results', () => {
      const fixture = setup({
        getHospitals: () => of([]),
        searchHospitals: () => of([]),
      });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('nonexistent');
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.isEmpty()).toBe(true);
      expect(component.isSearchActive()).toBe(true);
    });

    it('falls back to the full listing when the search query is cleared', () => {
      const getHospitalsSpy = vi.fn(() => of([{ id: '1', name: 'Hospital', status: 'approved' } as Hospital]));
      const fixture = setup({ getHospitals: getHospitalsSpy, searchHospitals: () => of([]) });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('apollo');
      fixture.componentInstance.onSearchInput('');
      fixture.detectChanges();

      expect(fixture.componentInstance.isSearchActive()).toBe(false);
      expect(getHospitalsSpy).toHaveBeenCalledTimes(2);
    });

    it('shows the loading state while a search request is pending', () => {
      const pending = new Subject<Hospital[]>();
      const fixture = setup({ getHospitals: () => of([]), searchHospitals: () => pending.asObservable() });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('apollo');
      fixture.detectChanges();

      expect(fixture.componentInstance.isLoading()).toBe(true);
    });

    it('shows the error state when the search request fails', () => {
      const fixture = setup({
        getHospitals: () => of([]),
        searchHospitals: () => throwError(() => new Error('search backend unavailable')),
      });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('apollo');
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.hasError()).toBe(true);
      expect(component.currentError()).toBe('search backend unavailable');
    });
  });
});
