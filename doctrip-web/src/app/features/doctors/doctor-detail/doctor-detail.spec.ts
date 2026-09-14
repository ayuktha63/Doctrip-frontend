import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { DoctorDetail } from './doctor-detail';
import { DoctorsService } from '../doctors.service';
import { Doctor } from '../doctor.model';

describe('DoctorDetail', () => {
  function setup(service: Partial<DoctorsService>, id: string | null = '1') {
    TestBed.configureTestingModule({
      imports: [DoctorDetail],
      providers: [
        { provide: DoctorsService, useValue: service },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(DoctorDetail);
    fixture.detectChanges();
    return fixture;
  }

  it('loads without requiring authentication (public access)', () => {
    const doctor: Doctor = { id: '1', name: 'Dr. Menon', status: 'approved' };
    const fixture = setup({ getDoctorById: () => of(doctor) });
    fixture.detectChanges();
    // No auth-related provider/token is required for the component to
    // construct and load successfully.
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.isLoaded()).toBe(true);
  });

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject<Doctor>();
    const fixture = setup({ getDoctorById: () => pending.asObservable() });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('displays approved doctor profile details', () => {
    const doctor: Doctor = {
      id: '1',
      name: 'Dr. Menon',
      status: 'approved',
      department: 'Cardiology',
      description: 'Senior consultant cardiologist.',
    };
    const fixture = setup({ getDoctorById: () => of(doctor) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isLoaded()).toBe(true);
    expect(component.profile()?.name).toBe('Dr. Menon');
    expect(component.profile()?.department).toBe('Cardiology');
  });

  it('handles missing profile information without breaking the loaded state', () => {
    const doctor: Doctor = { id: '1', name: 'No Description Doctor', status: 'approved' };
    const fixture = setup({ getDoctorById: () => of(doctor) });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoaded()).toBe(true);
    expect(fixture.componentInstance.profile()?.description).toBeUndefined();
  });

  it('treats an inactive/unapproved doctor as unavailable', () => {
    const doctor: Doctor = { id: '1', name: 'Retired Doctor', status: 'inactive' };
    const fixture = setup({ getDoctorById: () => of(doctor) });
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the unavailable state when no id is present in the route', () => {
    const fixture = setup({ getDoctorById: () => of() }, null);
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the error state when the profile cannot be loaded', () => {
    const fixture = setup({
      getDoctorById: () => throwError(() => new Error('backend unavailable')),
    });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.hasError()).toBe(true);
    expect(component.currentError()).toBe('backend unavailable');
  });
});
