import { TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';

import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { DiscoverDetail } from './discover-detail';
import { TreatmentsService } from '../../treatments/treatments.service';
import { HospitalsService } from '../../hospitals/hospitals.service';
import { DoctorsService } from '../../doctors/doctors.service';
import { BookingHandoffService } from '../../../core/auth/booking-handoff.service';
import { AuthService } from '../../../core/services/auth.service';

describe('DiscoverDetail', () => {
  function setup(options: {
    type?: string;
    id?: string | null;
    treatments?: Partial<TreatmentsService>;
    hospitals?: Partial<HospitalsService>;
    doctors?: Partial<DoctorsService>;
    bookingHandoff?: Partial<BookingHandoffService>;
  }) {
    const { type = 'treatments', id = '1' } = options;
    TestBed.configureTestingModule({
      imports: [DiscoverDetail],
      providers: [
        { provide: TreatmentsService, useValue: options.treatments ?? {} },
        { provide: HospitalsService, useValue: options.hospitals ?? {} },
        { provide: DoctorsService, useValue: options.doctors ?? {} },
        { provide: BookingHandoffService, useValue: options.bookingHandoff ?? { proceed: vi.fn() } },
        { provide: Router, useValue: { navigate: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ ...(type ? { type } : {}), ...(id ? { id } : {}) }) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(DiscoverDetail);
    fixture.detectChanges();
    return fixture;
  }

  it('loads a treatment package without requiring authentication', () => {
    const fixture = setup({
      type: 'treatments',
      treatments: { getTreatmentPackageById: () => of({ id: 1, name: 'Knee Replacement Package' }) },
    });
    fixture.detectChanges();
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.isLoaded()).toBe(true);
    expect(fixture.componentInstance.item()?.name).toBe('Knee Replacement Package');
  });

  it('loads a hospital via HospitalsService when type=hospitals', () => {
    const getHospitalById = vi.fn(() => of({ id: 1, name: 'City Care Hospital' }));
    const fixture = setup({ type: 'hospitals', hospitals: { getHospitalById } });
    fixture.detectChanges();
    expect(getHospitalById).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.isLoaded()).toBe(true);
  });

  it('loads a doctor via DoctorsService when type=doctors', () => {
    const getDoctorById = vi.fn(() => of({ id: 1, name: 'Dr. Asha Menon' }));
    const fixture = setup({ type: 'doctors', doctors: { getDoctorById } });
    fixture.detectChanges();
    expect(getDoctorById).toHaveBeenCalledWith('1');
    expect(fixture.componentInstance.isLoaded()).toBe(true);
  });

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject();
    const fixture = setup({ treatments: { getTreatmentPackageById: () => pending.asObservable() as any } });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('shows the unavailable state for an unknown type', () => {
    const fixture = setup({ type: 'not-a-real-type' });
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the unavailable state when no id is present in the route', () => {
    const fixture = setup({ id: null });
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('treats a 404 from the backend as unavailable', () => {
    const notFound = new HttpErrorResponse({ status: 404 });
    const fixture = setup({ treatments: { getTreatmentPackageById: () => throwError(() => notFound) } });
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the error state for a non-404 failure', () => {
    const serverError = new HttpErrorResponse({ status: 500, error: { message: 'backend unavailable' } });
    const fixture = setup({ treatments: { getTreatmentPackageById: () => throwError(() => serverError) } });
    fixture.detectChanges();
    expect(fixture.componentInstance.hasError()).toBe(true);
    expect(fixture.componentInstance.currentError()).toBe('backend unavailable');
  });

  describe('Book appointment (FE-WEB-2.9/2.11/2.12) — now applies to all three kinds', () => {
    it('does not proceed until a consultant is selected (new selection-gating alteration)', () => {
      const proceed = vi.fn();
      const fixture = setup({
        type: 'treatments',
        treatments: { getTreatmentPackageById: () => of({ id: 1, name: 'Knee Replacement Package' }) },
        bookingHandoff: { proceed },
      });
      fixture.detectChanges();

      expect(fixture.componentInstance.canBook()).toBe(false);
      fixture.componentInstance.proceedToBooking();

      expect(proceed).not.toHaveBeenCalled();
    });

    it('re-verifies and delegates to BookingHandoffService with treatmentPackageId + doctorId context once a consultant is selected', () => {
      const proceed = vi.fn();
      const fixture = setup({
        type: 'treatments',
        treatments: { getTreatmentPackageById: () => of({ id: 1, name: 'Knee Replacement Package' }) },
        bookingHandoff: { proceed },
      });
      fixture.detectChanges();

      fixture.componentInstance.selectDoctor(2);
      fixture.componentInstance.proceedToBooking();

      expect(proceed).toHaveBeenCalledWith(['/booking', 'treatment', '1'], {
        treatmentPackageId: '1',
        doctorId: '2',
      });
    });

    it('delegates to BookingHandoffService with hospitalId + doctorId context once a consultant is selected', () => {
      const proceed = vi.fn();
      const fixture = setup({
        type: 'hospitals',
        hospitals: { getHospitalById: () => of({ id: 1, name: 'City Care Hospital' }) },
        bookingHandoff: { proceed },
      });
      fixture.detectChanges();

      fixture.componentInstance.selectDoctor(2);
      fixture.componentInstance.proceedToBooking();

      expect(proceed).toHaveBeenCalledWith(['/booking', 'hospital', '1'], { hospitalId: '1', doctorId: '2' });
    });

    it('delegates to BookingHandoffService with doctorId context', () => {
      const proceed = vi.fn();
      const fixture = setup({
        type: 'doctors',
        doctors: { getDoctorById: () => of({ id: 1, name: 'Dr. Asha Menon' }) },
        bookingHandoff: { proceed },
      });
      fixture.detectChanges();

      fixture.componentInstance.proceedToBooking();

      expect(proceed).toHaveBeenCalledWith(['/booking', 'doctor', '1'], { doctorId: '1' });
    });

    it('shows unavailable instead of proceeding when the record was removed (404 on re-verify)', () => {
      const proceed = vi.fn();
      let callCount = 0;
      const getTreatmentPackageById = vi.fn(() => {
        callCount += 1;
        if (callCount === 1) return of({ id: 1, name: 'Knee Replacement Package' });
        return throwError(() => new HttpErrorResponse({ status: 404 }));
      });
      const fixture = setup({ treatments: { getTreatmentPackageById }, bookingHandoff: { proceed } });
      fixture.detectChanges();

      fixture.componentInstance.selectDoctor(2);
      fixture.componentInstance.proceedToBooking();

      expect(proceed).not.toHaveBeenCalled();
      expect(fixture.componentInstance.isUnavailable()).toBe(true);
    });

    it('end-to-end: redirects an unauthenticated visitor to /auth with hospitalId context', () => {
      const navigate = vi.fn();
      TestBed.configureTestingModule({
        imports: [DiscoverDetail],
        providers: [
          { provide: TreatmentsService, useValue: {} },
          { provide: HospitalsService, useValue: { getHospitalById: () => of({ id: 1, name: 'City Care Hospital' }) } },
          { provide: DoctorsService, useValue: {} },
          { provide: AuthService, useValue: { isAuthenticated: () => false } },
          { provide: Router, useValue: { navigate } },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: convertToParamMap({ type: 'hospitals', id: '1' }) } },
          },
        ],
      });
      const fixture = TestBed.createComponent(DiscoverDetail);
      fixture.detectChanges();

      fixture.componentInstance.selectDoctor(2);
      fixture.componentInstance.proceedToBooking();

      expect(navigate).toHaveBeenCalledWith(['/auth'], {
        queryParams: { returnUrl: '/booking/hospital/1', hospitalId: '1', doctorId: '2' },
      });
    });
  });

  describe('real detail fields (confirmed backend contract)', () => {
    it('exposes the facts grid and team list from a treatment package detail response', () => {
      const fixture = setup({
        type: 'treatments',
        treatments: {
          getTreatmentPackageById: () =>
            of({
              id: 1,
              name: 'Knee Replacement Surgery',
              department: 'Orthopaedics',
              price: 120000,
              typicalStay: '10 days including rehab',
              hospitalName: 'Aster Medcity',
              team: [{ id: 2, name: 'Dr. Nandita Rao', specialty: 'Sports orthopaedics', department: 'Orthopaedics' }],
            }),
        },
      });
      fixture.detectChanges();
      const component = fixture.componentInstance;
      expect(component.facts().map((f) => f.key)).toEqual(['Department', 'Typical stay', 'Package from', 'Hospital']);
      expect(component.team().length).toBe(1);
      expect(component.team()[0].name).toBe('Dr. Nandita Rao');
    });

    it('omits facts the record does not have (no fabrication)', () => {
      const fixture = setup({
        type: 'hospitals',
        hospitals: { getHospitalById: () => of({ id: 1, name: 'Minimal Hospital' }) },
      });
      fixture.detectChanges();
      expect(fixture.componentInstance.facts()).toEqual([]);
      expect(fixture.componentInstance.team()).toEqual([]);
      expect(fixture.componentInstance.meta()).toBeUndefined();
    });

    it('alteration: a Doctor detail page never shows a team/colleagues list, even if the backend returns one', () => {
      const fixture = setup({
        type: 'doctors',
        doctors: {
          getDoctorById: () =>
            of({
              id: 1,
              name: 'Dr. Asha Menon',
              team: [{ id: 2, name: 'Dr. Someone Else', department: 'Cardiology' }],
            }),
        },
      });
      fixture.detectChanges();
      expect(fixture.componentInstance.team()).toEqual([]);
      expect(fixture.componentInstance.needsDoctorSelection()).toBe(false);
      expect(fixture.componentInstance.canBook()).toBe(true);
    });
  });

  describe('Hospital detail — department-then-doctor selection (alteration)', () => {
    function hospitalWithTeam() {
      return setup({
        type: 'hospitals',
        hospitals: {
          getHospitalById: () =>
            of({
              id: 1,
              name: 'City Care Hospital',
              team: [
                { id: 10, name: 'Dr. A', department: 'Cardiology' },
                { id: 11, name: 'Dr. B', department: 'Cardiology' },
                { id: 12, name: 'Dr. C', department: 'Orthopaedics' },
              ],
            }),
        },
      });
    }

    it('groups the team by department and shows departments before any doctor list', () => {
      const fixture = hospitalWithTeam();
      fixture.detectChanges();
      const groups = fixture.componentInstance.departmentGroups();
      expect(groups.map((g) => g.department).sort()).toEqual(['Cardiology', 'Orthopaedics']);
      expect(fixture.componentInstance.activeDepartment()).toBeNull();
      expect(fixture.componentInstance.doctorsForSelectedDepartment()).toEqual([]);
    });

    it('selecting a department reveals only that department\'s doctors; selecting a doctor enables booking', () => {
      const fixture = hospitalWithTeam();
      fixture.detectChanges();
      const component = fixture.componentInstance;

      expect(component.canBook()).toBe(false);
      component.selectDepartment('Cardiology');
      expect(component.doctorsForSelectedDepartment().map((d) => d.id)).toEqual([10, 11]);
      expect(component.canBook()).toBe(false);

      component.selectDoctor(10);
      expect(component.canBook()).toBe(true);
    });

    it('switching department clears the previously selected doctor and re-disables booking', () => {
      const fixture = hospitalWithTeam();
      fixture.detectChanges();
      const component = fixture.componentInstance;

      component.selectDepartment('Cardiology');
      component.selectDoctor(10);
      expect(component.canBook()).toBe(true);

      component.selectDepartment('Orthopaedics');
      expect(component.selectedDoctor()).toBeNull();
      expect(component.canBook()).toBe(false);
    });
  });

  it('"Back to discovery" returns to /discover with the originating tab preserved', () => {
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      imports: [DiscoverDetail],
      providers: [
        { provide: TreatmentsService, useValue: {} },
        { provide: HospitalsService, useValue: { getHospitalById: () => of({ id: 1, name: 'City Care Hospital' }) } },
        { provide: DoctorsService, useValue: {} },
        { provide: BookingHandoffService, useValue: { proceed: vi.fn() } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap({ type: 'hospitals', id: '1' }) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(DiscoverDetail);
    fixture.detectChanges();

    fixture.componentInstance.backToDiscovery();

    expect(navigate).toHaveBeenCalledWith(['/discover'], { queryParams: { tab: 'Hospitals' } });
  });
});
