import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { HospitalDetail } from './hospital-detail';
import { HospitalsService } from '../hospitals.service';
import { Hospital } from '../hospital.model';

describe('HospitalDetail', () => {
  function setup(service: Partial<HospitalsService>, id: string | null = '1') {
    TestBed.configureTestingModule({
      imports: [HospitalDetail],
      providers: [
        { provide: HospitalsService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(HospitalDetail);
    fixture.detectChanges();
    return fixture;
  }

  it('loads without requiring authentication (public access)', () => {
    const hospital: Hospital = { id: '1', name: 'Apollo Hospital', status: 'approved' };
    const fixture = setup({ getHospitalById: () => of(hospital) });
    fixture.detectChanges();
    // No auth-related provider/token is required for the component to
    // construct and load successfully.
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.isLoaded()).toBe(true);
  });

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject<Hospital>();
    const fixture = setup({ getHospitalById: () => pending.asObservable() });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('displays approved hospital profile details', () => {
    const hospital: Hospital = {
      id: '1',
      name: 'Apollo Hospital',
      status: 'approved',
      city: 'Chennai',
      description: 'Multi-specialty hospital.',
    };
    const fixture = setup({ getHospitalById: () => of(hospital) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isLoaded()).toBe(true);
    expect(component.profile()?.name).toBe('Apollo Hospital');
    expect(component.profile()?.city).toBe('Chennai');
  });

  it('handles missing profile information without breaking the loaded state', () => {
    const hospital: Hospital = { id: '1', name: 'No Description Hospital', status: 'approved' };
    const fixture = setup({ getHospitalById: () => of(hospital) });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoaded()).toBe(true);
    expect(fixture.componentInstance.profile()?.description).toBeUndefined();
  });

  it('treats an inactive/unapproved hospital as unavailable', () => {
    const hospital: Hospital = { id: '1', name: 'Closed Hospital', status: 'inactive' };
    const fixture = setup({ getHospitalById: () => of(hospital) });
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the unavailable state when no id is present in the route', () => {
    const fixture = setup({ getHospitalById: () => of() }, null);
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the error state when the profile cannot be loaded', () => {
    const fixture = setup({
      getHospitalById: () => throwError(() => new Error('backend unavailable')),
    });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.hasError()).toBe(true);
    expect(component.currentError()).toBe('backend unavailable');
  });
});
