import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { vi } from 'vitest';
import { BookingHandoffService } from './booking-handoff.service';
import { AuthService } from '../services/auth.service';

describe('BookingHandoffService', () => {
  function setup(isAuthenticated: boolean) {
    const navigate = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: { isAuthenticated: () => isAuthenticated } },
        { provide: Router, useValue: { navigate } },
      ],
    });
    return { service: TestBed.inject(BookingHandoffService), navigate };
  }

  it('proceeds to the booking destination when the user is authenticated (AC-8)', () => {
    const { service, navigate } = setup(true);
    service.proceed(['/booking', 'treatment', '1']);
    expect(navigate).toHaveBeenCalledWith(['/booking', 'treatment', '1']);
  });

  it('redirects to Login/Sign Up with the booking destination preserved as returnUrl (AC-9, FE-WEB-2.10)', () => {
    const { service, navigate } = setup(false);
    service.proceed(['/booking', 'treatment', '1']);
    expect(navigate).toHaveBeenCalledWith(['/auth'], {
      queryParams: { returnUrl: '/booking/treatment/1' },
    });
  });

  it('does not proceed to the booking destination when unauthenticated', () => {
    const { service, navigate } = setup(false);
    service.proceed(['/booking', 'treatment', '1']);
    expect(navigate).not.toHaveBeenCalledWith(['/booking', 'treatment', '1']);
  });

  describe('FE-WEB-2.11 — Preserve Discovery Context During Authentication', () => {
    it('carries the provided discovery context alongside returnUrl on redirect (AC-11)', () => {
      const { service, navigate } = setup(false);
      service.proceed(['/booking', 'treatment', '1'], { treatmentPackageId: '1' });
      expect(navigate).toHaveBeenCalledWith(['/auth'], {
        queryParams: { returnUrl: '/booking/treatment/1', treatmentPackageId: '1' },
      });
    });

    it('only includes context fields that were actually provided, never fabricated ones', () => {
      const { service, navigate } = setup(false);
      service.proceed(['/booking', 'treatment', '1'], { treatmentPackageId: '1' });
      const call = navigate.mock.calls[0];
      expect(call[1].queryParams).not.toHaveProperty('hospitalId');
      expect(call[1].queryParams).not.toHaveProperty('department');
      expect(call[1].queryParams).not.toHaveProperty('doctorId');
    });

    it('redirects with only returnUrl when no discovery context is given', () => {
      const { service, navigate } = setup(false);
      service.proceed(['/booking', 'treatment', '1']);
      expect(navigate).toHaveBeenCalledWith(['/auth'], {
        queryParams: { returnUrl: '/booking/treatment/1' },
      });
    });
  });
});
