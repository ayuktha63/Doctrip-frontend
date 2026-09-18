import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

const PUBLIC_AUTH_PATHS = ['/auth/register', '/auth/otp/', '/auth/login', '/auth/token/refresh'];

/**
 * Attaches the JWT bearer token to every request and handles 401s globally. Explicitly skips
 * `/api/hospital-admin/**` — that path prefix carries its own separate bearer token via
 * `hospitalAdminAuthInterceptor` (Story 4), and this interceptor must never attach the patient
 * token to those calls.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.url.includes('/api/hospital-admin')) return next(req);

  const auth = inject(AuthService);
  const router = inject(Router);

  const token = auth.accessToken();
  const authorizedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorizedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isPublicAuthCall = PUBLIC_AUTH_PATHS.some((path) => req.url.includes(path));
      if (err.status === 401 && !isPublicAuthCall) {
        auth.clearSession();
        router.navigate(['/auth']);
      }
      return throwError(() => err);
    }),
  );
};
