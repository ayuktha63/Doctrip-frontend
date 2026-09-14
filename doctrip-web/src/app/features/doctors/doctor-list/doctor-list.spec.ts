import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DoctorList } from './doctor-list';
import { DoctorsService } from '../doctors.service';
import { Doctor } from '../doctor.model';

describe('DoctorList', () => {
  function setup(service: Partial<DoctorsService>) {
    TestBed.configureTestingModule({
      imports: [DoctorList],
      providers: [
        { provide: DoctorsService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(DoctorList);
    fixture.detectChanges();
    return fixture;
  }

  it('loads without requiring authentication (public discovery)', () => {
    const fixture = setup({ getDoctors: () => of([{ id: '1', name: 'Dr. Nair', status: 'approved' }]) });
    fixture.detectChanges();
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.visibleDoctors().length).toBe(1);
  });

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject<Doctor[]>();
    const fixture = setup({ getDoctors: () => pending.asObservable() });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('shows the empty state when there are no approved doctors', () => {
    const fixture = setup({ getDoctors: () => of([]) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isEmpty()).toBe(true);
    expect(component.visibleDoctors().length).toBe(0);
  });

  it('shows only approved doctors and filters out inactive ones', () => {
    const doctors: Doctor[] = [
      { id: '1', name: 'Approved Doctor', status: 'approved' },
      { id: '2', name: 'Inactive Doctor', status: 'inactive' },
    ];
    const fixture = setup({ getDoctors: () => of(doctors) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.visibleDoctors().length).toBe(1);
    expect(component.visibleDoctors()[0].id).toBe('1');
  });

  it('shows the error state when discovery data cannot be loaded', () => {
    const fixture = setup({
      getDoctors: () => throwError(() => new Error('backend unavailable')),
    });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.hasError()).toBe(true);
    expect(component.currentError()).toBe('backend unavailable');
  });

  it('navigates toward the selected doctor on selection', () => {
    const doctors: Doctor[] = [{ id: '42', name: 'Doctor', status: 'approved' }];
    const fixture = setup({ getDoctors: () => of(doctors) });
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    fixture.componentInstance.selectDoctor(doctors[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/doctors', '42']);
  });

  describe('FE-WEB-2.7 — Doctor Search', () => {
    it('searches via DoctorsService without requiring authentication', () => {
      const searchSpy = vi.fn(() => of([{ id: '1', name: 'Dr. Menon', status: 'approved' } as Doctor]));
      const fixture = setup({ getDoctors: () => of([]), searchDoctors: searchSpy });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('menon');
      fixture.detectChanges();

      // No auth token/header is passed — the stub signature takes only
      // the query string, confirming no auth dependency was introduced.
      expect(searchSpy).toHaveBeenCalledWith('menon');
    });

    it('displays matching doctor results for a search query', () => {
      const fixture = setup({
        getDoctors: () => of([]),
        searchDoctors: () => of([{ id: '1', name: 'Dr. Menon', status: 'approved' }]),
      });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('menon');
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.isSearchActive()).toBe(true);
      expect(component.visibleDoctors().length).toBe(1);
      expect(component.visibleDoctors()[0].name).toBe('Dr. Menon');
    });

    it('shows an appropriate empty state when a search has no matching results', () => {
      const fixture = setup({
        getDoctors: () => of([]),
        searchDoctors: () => of([]),
      });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('nonexistent');
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.isEmpty()).toBe(true);
      expect(component.isSearchActive()).toBe(true);
    });

    it('falls back to the full listing when the search query is cleared', () => {
      const getDoctorsSpy = vi.fn(() => of([{ id: '1', name: 'Doctor', status: 'approved' } as Doctor]));
      const fixture = setup({ getDoctors: getDoctorsSpy, searchDoctors: () => of([]) });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('menon');
      fixture.componentInstance.onSearchInput('');
      fixture.detectChanges();

      expect(fixture.componentInstance.isSearchActive()).toBe(false);
      expect(getDoctorsSpy).toHaveBeenCalledTimes(2);
    });

    it('shows the loading state while a search request is pending', () => {
      const pending = new Subject<Doctor[]>();
      const fixture = setup({ getDoctors: () => of([]), searchDoctors: () => pending.asObservable() });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('menon');
      fixture.detectChanges();

      expect(fixture.componentInstance.isLoading()).toBe(true);
    });

    it('shows the error state when the search request fails', () => {
      const fixture = setup({
        getDoctors: () => of([]),
        searchDoctors: () => throwError(() => new Error('search backend unavailable')),
      });
      fixture.detectChanges();

      fixture.componentInstance.onSearchInput('menon');
      fixture.detectChanges();

      const component = fixture.componentInstance;
      expect(component.hasError()).toBe(true);
      expect(component.currentError()).toBe('search backend unavailable');
    });
  });
});
