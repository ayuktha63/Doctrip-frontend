import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { Subject, of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { TreatmentDetail } from './treatment-detail';
import { TreatmentsService } from '../treatments.service';
import { TreatmentPackage } from '../treatment-package.model';
import { BookingHandoffService } from '../../../core/auth/booking-handoff.service';
import { AuthService } from '../../../core/auth/auth.service';

describe('TreatmentDetail', () => {
  function setup(
    service: Partial<TreatmentsService>,
    id: string | null = '1',
    bookingHandoff: Partial<BookingHandoffService> = { proceed: vi.fn() },
  ) {
    TestBed.configureTestingModule({
      imports: [TreatmentDetail],
      providers: [
        { provide: TreatmentsService, useValue: service },
        { provide: BookingHandoffService, useValue: bookingHandoff },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(id ? { id } : {}) } },
        },
      ],
    });
    const fixture = TestBed.createComponent(TreatmentDetail);
    fixture.detectChanges();
    return fixture;
  }

  it('shows the loading state while the request is pending', () => {
    const pending = new Subject<TreatmentPackage>();
    const fixture = setup({ getTreatmentPackageById: () => pending.asObservable() });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoading()).toBe(true);
  });

  it('displays approved package details', () => {
    const pkg: TreatmentPackage = { id: 1, name: 'Knee Surgery', status: 'approved', description: 'Full knee replacement.' };
    const fixture = setup({ getTreatmentPackageById: () => of(pkg) });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.isLoaded()).toBe(true);
    expect(component.package()?.name).toBe('Knee Surgery');
  });

  it('treats an inactive/unapproved package as unavailable', () => {
    const pkg: TreatmentPackage = { id: 1, name: 'Old Package', status: 'inactive' };
    const fixture = setup({ getTreatmentPackageById: () => of(pkg) });
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the unavailable state when no id is present in the route', () => {
    const fixture = setup({ getTreatmentPackageById: () => of() }, null);
    fixture.detectChanges();
    expect(fixture.componentInstance.isUnavailable()).toBe(true);
  });

  it('shows the error state when the package cannot be loaded', () => {
    const fixture = setup({
      getTreatmentPackageById: () => throwError(() => new Error('backend unavailable')),
    });
    fixture.detectChanges();
    const component = fixture.componentInstance;
    expect(component.hasError()).toBe(true);
    expect(component.currentError()).toBe('backend unavailable');
  });

  it('handles missing description without breaking the loaded state', () => {
    const pkg: TreatmentPackage = { id: 1, name: 'No Description Package', status: 'approved' };
    const fixture = setup({ getTreatmentPackageById: () => of(pkg) });
    fixture.detectChanges();
    expect(fixture.componentInstance.isLoaded()).toBe(true);
    expect(fixture.componentInstance.package()?.description).toBeUndefined();
  });

  it('loads and displays details without requiring authentication (public discovery, FE-WEB-2.13)', () => {
    const pkg: TreatmentPackage = { id: 1, name: 'Knee Surgery', status: 'approved' };
    const fixture = setup({ getTreatmentPackageById: () => of(pkg) });
    fixture.detectChanges();
    // No AuthService provider is registered for this test — viewing the
    // package details never needs one, only the Book action does.
    expect(fixture.componentInstance.hasError()).toBe(false);
    expect(fixture.componentInstance.isLoaded()).toBe(true);
  });

  describe('FE-WEB-2.9 — Book Appointment Authentication Handoff', () => {
    it('delegates the proceed-to-booking decision to BookingHandoffService', () => {
      const proceed = vi.fn();
      const pkg: TreatmentPackage = { id: 1, name: 'Knee Surgery', status: 'approved' };
      const fixture = setup({ getTreatmentPackageById: () => of(pkg) }, '1', { proceed });
      fixture.detectChanges();

      fixture.componentInstance.proceedToBooking();

      expect(proceed).toHaveBeenCalledWith(['/booking', 'treatment', '1'], {
        treatmentPackageId: '1',
      });
    });

    it('does not call BookingHandoffService when no package has loaded', () => {
      const proceed = vi.fn();
      const pending = new Subject<TreatmentPackage>();
      const fixture = setup({ getTreatmentPackageById: () => pending.asObservable() }, '1', { proceed });
      fixture.detectChanges();

      fixture.componentInstance.proceedToBooking();

      expect(proceed).not.toHaveBeenCalled();
    });
  });

  describe('FE-WEB-2.11 — Preserve Discovery Context During Authentication', () => {
    it('passes the selected treatment package as discovery context', () => {
      const proceed = vi.fn();
      const pkg: TreatmentPackage = { id: 1, name: 'Knee Surgery', status: 'approved' };
      const fixture = setup({ getTreatmentPackageById: () => of(pkg) }, '1', { proceed });
      fixture.detectChanges();

      fixture.componentInstance.proceedToBooking();

      expect(proceed).toHaveBeenCalledWith(['/booking', 'treatment', '1'], {
        treatmentPackageId: '1',
      });
    });
  });

  describe('FE-WEB-2.12 — Selected record unavailable before booking starts', () => {
    it('re-verifies availability and proceeds to booking when still approved', () => {
      const proceed = vi.fn();
      const getTreatmentPackageById = vi.fn(() =>
        of<TreatmentPackage>({ id: 1, name: 'Knee Surgery', status: 'approved' }),
      );
      const fixture = setup({ getTreatmentPackageById }, '1', { proceed });
      fixture.detectChanges();

      fixture.componentInstance.proceedToBooking();

      expect(getTreatmentPackageById).toHaveBeenCalledTimes(2); // initial load + re-verify
      expect(proceed).toHaveBeenCalledWith(['/booking', 'treatment', '1'], {
        treatmentPackageId: '1',
      });
    });

    it('shows the unavailable state instead of proceeding when the package became inactive', () => {
      const proceed = vi.fn();
      let callCount = 0;
      const getTreatmentPackageById = vi.fn(() => {
        callCount += 1;
        const status = callCount === 1 ? 'approved' : 'inactive';
        return of<TreatmentPackage>({ id: 1, name: 'Knee Surgery', status });
      });
      const fixture = setup({ getTreatmentPackageById }, '1', { proceed });
      fixture.detectChanges();
      expect(fixture.componentInstance.isLoaded()).toBe(true);

      fixture.componentInstance.proceedToBooking();

      expect(proceed).not.toHaveBeenCalled();
      expect(fixture.componentInstance.isUnavailable()).toBe(true);
    });

    it('shows the error state and does not proceed when re-verification fails', () => {
      const proceed = vi.fn();
      let callCount = 0;
      const getTreatmentPackageById = vi.fn(() => {
        callCount += 1;
        if (callCount === 1) {
          return of<TreatmentPackage>({ id: 1, name: 'Knee Surgery', status: 'approved' });
        }
        return throwError(() => new Error('backend unavailable'));
      });
      const fixture = setup({ getTreatmentPackageById }, '1', { proceed });
      fixture.detectChanges();

      fixture.componentInstance.proceedToBooking();

      expect(proceed).not.toHaveBeenCalled();
      expect(fixture.componentInstance.hasError()).toBe(true);
      expect(fixture.componentInstance.currentError()).toBe('backend unavailable');
    });

    it('disables the Book action while verification is in flight', () => {
      const proceed = vi.fn();
      const pending = new Subject<TreatmentPackage>();
      const getTreatmentPackageById = vi
        .fn()
        .mockReturnValueOnce(of<TreatmentPackage>({ id: 1, name: 'Knee Surgery', status: 'approved' }))
        .mockReturnValueOnce(pending.asObservable());
      const fixture = setup({ getTreatmentPackageById }, '1', { proceed });
      fixture.detectChanges();

      fixture.componentInstance.proceedToBooking();

      expect(fixture.componentInstance.isVerifyingBooking()).toBe(true);
      expect(proceed).not.toHaveBeenCalled();
    });
  });

  describe('FE-WEB-2.13 — Public Discovery Access and Protected Booking Boundary', () => {
    // These use the REAL BookingHandoffService (not a mock) with a fake
    // AuthService + Router, to prove the end-to-end boundary: discovery
    // itself never checks authentication, but the Book action does.
    function setupWithRealBookingHandoff(isAuthenticated: boolean, pkg: TreatmentPackage) {
      const navigate = vi.fn();
      TestBed.configureTestingModule({
        imports: [TreatmentDetail],
        providers: [
          { provide: TreatmentsService, useValue: { getTreatmentPackageById: () => of(pkg) } },
          { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } },
          { provide: Router, useValue: { navigate } },
          {
            provide: ActivatedRoute,
            useValue: { snapshot: { paramMap: convertToParamMap({ id: String(pkg.id) }) } },
          },
        ],
      });
      const fixture = TestBed.createComponent(TreatmentDetail);
      fixture.detectChanges();
      return { fixture, navigate };
    }

    it('allows an authenticated user to proceed toward booking', () => {
      const pkg: TreatmentPackage = { id: 1, name: 'Knee Surgery', status: 'approved' };
      const { fixture, navigate } = setupWithRealBookingHandoff(true, pkg);

      fixture.componentInstance.proceedToBooking();

      expect(navigate).toHaveBeenCalledWith(['/booking', 'treatment', '1']);
    });

    it('redirects an unauthenticated user to Login/Sign Up instead of proceeding to booking', () => {
      const pkg: TreatmentPackage = { id: 1, name: 'Knee Surgery', status: 'approved' };
      const { fixture, navigate } = setupWithRealBookingHandoff(false, pkg);

      fixture.componentInstance.proceedToBooking();

      expect(navigate).toHaveBeenCalledWith(['/login'], {
        queryParams: { returnUrl: '/booking/treatment/1', treatmentPackageId: '1' },
      });
      expect(navigate).not.toHaveBeenCalledWith(['/booking', 'treatment', '1']);
    });

    it('lets an unauthenticated visitor view discovery details before ever reaching the booking check', () => {
      const pkg: TreatmentPackage = { id: 1, name: 'Knee Surgery', status: 'approved' };
      const { fixture, navigate } = setupWithRealBookingHandoff(false, pkg);

      // Viewing the page (fixture already loaded via detectChanges in
      // setupWithRealBookingHandoff) must not have triggered any
      // navigation — only selecting Book does.
      expect(navigate).not.toHaveBeenCalled();
      expect(fixture.componentInstance.isLoaded()).toBe(true);
    });
  });
});
