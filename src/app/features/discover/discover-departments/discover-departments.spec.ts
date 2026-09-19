import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { DiscoverDepartments } from './discover-departments';
import { DepartmentsService } from '../../departments/departments.service';
import { DepartmentSummary } from '../../departments/department.model';

describe('DiscoverDepartments', () => {
  function setup(list: DepartmentSummary[]) {
    TestBed.configureTestingModule({
      imports: [DiscoverDepartments],
      providers: [
        { provide: DepartmentsService, useValue: { list: () => of(list) } },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(DiscoverDepartments);
    fixture.detectChanges();
    return fixture;
  }

  const departments: DepartmentSummary[] = [
    { name: 'Cardiology', treatmentCount: 2, doctorCount: 1, hospitalNames: ['Aster Medcity'], fromPrice: 195000 },
    { name: 'Orthopaedics', treatmentCount: 3, doctorCount: 3, hospitalNames: ['Aster Medcity'], fromPrice: 120000 },
    { name: 'Eye care', treatmentCount: 1, doctorCount: 1, hospitalNames: ['Aster Medcity'], fromPrice: 38000 },
  ];

  it('shows every department when there is no search query', () => {
    const fixture = setup(departments);
    expect(fixture.componentInstance.items().length).toBe(3);
    expect(fixture.componentInstance.isEmpty()).toBe(false);
  });

  it('filters by department name (bound to the shared Discover search box query)', () => {
    const fixture = setup(departments);
    fixture.componentRef.setInput('query', 'cardio');
    fixture.detectChanges();

    const names = fixture.componentInstance.items().map((d) => d.name);
    expect(names).toEqual(['Cardiology']);
  });

  it('filters by the department blurb text too (e.g. "LASIK" matches Eye care)', () => {
    const fixture = setup(departments);
    fixture.componentRef.setInput('query', 'lasik');
    fixture.detectChanges();

    const names = fixture.componentInstance.items().map((d) => d.name);
    expect(names).toEqual(['Eye care']);
  });

  it('is case-insensitive', () => {
    const fixture = setup(departments);
    fixture.componentRef.setInput('query', 'ORTHO');
    fixture.detectChanges();

    expect(fixture.componentInstance.items().map((d) => d.name)).toEqual(['Orthopaedics']);
  });

  it('shows a search-specific empty message when a query matches nothing', () => {
    const fixture = setup(departments);
    fixture.componentRef.setInput('query', 'nonexistent');
    fixture.detectChanges();

    expect(fixture.componentInstance.isEmpty()).toBe(true);
    expect(fixture.componentInstance.isSearching()).toBe(true);
  });

  it('clearing the query restores the full list', () => {
    const fixture = setup(departments);
    fixture.componentRef.setInput('query', 'cardio');
    fixture.detectChanges();
    expect(fixture.componentInstance.items().length).toBe(1);

    fixture.componentRef.setInput('query', '');
    fixture.detectChanges();
    expect(fixture.componentInstance.items().length).toBe(3);
  });
});
