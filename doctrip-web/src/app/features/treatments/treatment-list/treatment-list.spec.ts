import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { TreatmentList } from './treatment-list';
import { TreatmentsService } from '../treatments.service';
import { TreatmentPackage } from '../treatment-package.model';

describe('TreatmentList', () => {
  function setup(service: Partial<TreatmentsService>) {
    TestBed.configureTestingModule({
      imports: [TreatmentList],
      providers: [
        { provide: TreatmentsService, useValue: service },
        { provide: Router, useValue: { navigate: vi.fn() } },
      ],
    });
    const fixture = TestBed.createComponent(TreatmentList);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject<TreatmentPackage[]>();
    const fixture = setup({ getTreatmentPackages: () => pending.asObservable() });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('shows the empty state when there are no approved packages', () => {
    const fixture = setup({ getTreatmentPackages: () => of([]) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isEmpty()).toBe(true);
    expect(component.visiblePackages().length).toBe(0);
  });

  it('shows only approved packages and filters out inactive ones', () => {
    const packages: TreatmentPackage[] = [
      { id: '1', name: 'Approved Package', status: 'approved' },
      { id: '2', name: 'Inactive Package', status: 'inactive' },
    ];
    const fixture = setup({ getTreatmentPackages: () => of(packages) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.visiblePackages().length).toBe(1);
    expect(component.visiblePackages()[0].id).toBe('1');
  });

  it('shows the error state when discovery data cannot be loaded', () => {
    const fixture = setup({
      getTreatmentPackages: () => throwError(() => new Error('backend unavailable')),
    });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.hasError()).toBe(true);
    expect(component.currentError()).toBe('backend unavailable');
  });

  it('navigates toward the selected package on selection', () => {
    const packages: TreatmentPackage[] = [{ id: '42', name: 'Package', status: 'approved' }];
    const fixture = setup({ getTreatmentPackages: () => of(packages) });
    fixture.detectChanges();
    const router = TestBed.inject(Router);
    fixture.componentInstance.selectPackage(packages[0]);
    expect(router.navigate).toHaveBeenCalledWith(['/treatments', '42']);
  });

  it('loads without requiring authentication (public discovery, FE-WEB-2.13)', () => {
    const fixture = setup({ getTreatmentPackages: () => of([{ id: '1', name: 'Package', status: 'approved' }]) });
    fixture.detectChanges();
    // No AuthService provider is registered for this test at all — the
    // component still constructs and loads successfully, confirming
    // treatment discovery has no authentication dependency.
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.visiblePackages().length).toBe(1);
  });
});
