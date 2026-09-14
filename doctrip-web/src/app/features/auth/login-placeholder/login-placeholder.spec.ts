import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { vi } from 'vitest';
import { LoginPlaceholder } from './login-placeholder';
import { AuthService } from '../../../core/auth/auth.service';

describe('LoginPlaceholder', () => {
  function setup(
    queryParams: Record<string, string> = {},
    authService: Partial<AuthService> = { signIn: vi.fn() },
  ) {
    const navigate = vi.fn();
    const navigateByUrl = vi.fn();
    TestBed.configureTestingModule({
      imports: [LoginPlaceholder],
      providers: [
        { provide: AuthService, useValue: authService },
        { provide: Router, useValue: { navigate, navigateByUrl } },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { queryParamMap: convertToParamMap(queryParams) },
          },
        },
      ],
    });
    const fixture = TestBed.createComponent(LoginPlaceholder);
    fixture.detectChanges();
    return { fixture, navigate, navigateByUrl };
  }

  describe('FE-WEB-2.10 — Continue Booking After Authentication', () => {
    it('reads the preserved returnUrl from the redirect (context preservation)', () => {
      const { fixture } = setup({ returnUrl: '/booking/treatment/1' });
      expect(fixture.componentInstance.returnUrl()).toBe('/booking/treatment/1');
    });

    it('continues to the preserved booking destination after successful authentication (AC-10)', () => {
      const signIn = vi.fn();
      const { fixture, navigateByUrl } = setup({ returnUrl: '/booking/treatment/1' }, { signIn });

      fixture.componentInstance.simulateSuccessfulSignIn();

      expect(signIn).toHaveBeenCalled();
      expect(navigateByUrl).toHaveBeenCalledWith('/booking/treatment/1');
    });

    it('falls back to discovery when there is no returnUrl to continue to', () => {
      const signIn = vi.fn();
      const { fixture, navigate } = setup({}, { signIn });

      fixture.componentInstance.simulateSuccessfulSignIn();

      expect(navigate).toHaveBeenCalledWith(['/treatments']);
    });

    it('does not continue to the booking destination when authentication fails', () => {
      const signIn = vi.fn();
      const { fixture, navigate, navigateByUrl } = setup({ returnUrl: '/booking/treatment/1' }, { signIn });

      fixture.componentInstance.simulateAuthenticationFailure();

      expect(signIn).not.toHaveBeenCalled();
      expect(navigate).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(fixture.componentInstance.hasFailed()).toBe(true);
    });

    it('does not authenticate or continue to the booking destination when login is cancelled', () => {
      const signIn = vi.fn();
      const { fixture, navigate, navigateByUrl } = setup({ returnUrl: '/booking/treatment/1' }, { signIn });

      fixture.componentInstance.cancel();

      expect(signIn).not.toHaveBeenCalled();
      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/treatments']);
    });
  });

  describe('FE-WEB-2.11 — Preserve Discovery Context During Authentication', () => {
    it('reads the preserved discovery context from the redirect', () => {
      const { fixture } = setup({ returnUrl: '/booking/treatment/1', treatmentPackageId: '1' });
      expect(fixture.componentInstance.discoveryContext()).toEqual({ treatmentPackageId: '1' });
    });

    it('re-attaches the preserved discovery context to the continuation URL after successful authentication (AC-11)', () => {
      const signIn = vi.fn();
      const { fixture, navigateByUrl } = setup(
        { returnUrl: '/booking/treatment/1', treatmentPackageId: '1' },
        { signIn },
      );

      fixture.componentInstance.simulateSuccessfulSignIn();

      expect(navigateByUrl).toHaveBeenCalledWith('/booking/treatment/1?treatmentPackageId=1');
    });

    it('continues with no query string when no discovery context was preserved', () => {
      const signIn = vi.fn();
      const { fixture, navigateByUrl } = setup({ returnUrl: '/booking/treatment/1' }, { signIn });

      fixture.componentInstance.simulateSuccessfulSignIn();

      expect(navigateByUrl).toHaveBeenCalledWith('/booking/treatment/1');
    });

    it('drops discovery context that cannot be attributed to any destination (no returnUrl)', () => {
      const signIn = vi.fn();
      const { fixture, navigate, navigateByUrl } = setup({ treatmentPackageId: '1' }, { signIn });

      fixture.componentInstance.simulateSuccessfulSignIn();

      expect(navigateByUrl).not.toHaveBeenCalled();
      expect(navigate).toHaveBeenCalledWith(['/treatments']);
    });

    it('does not re-attach context when authentication fails or is cancelled', () => {
      const signIn = vi.fn();
      const { fixture, navigateByUrl } = setup(
        { returnUrl: '/booking/treatment/1', treatmentPackageId: '1' },
        { signIn },
      );

      fixture.componentInstance.simulateAuthenticationFailure();
      fixture.componentInstance.cancel();

      expect(navigateByUrl).not.toHaveBeenCalled();
    });
  });
});
