import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { HospitalAdminAuthService } from '../services/hospital-admin-auth.service';

const HOSPITAL_ADMIN_PATH = '/api/hospital-admin';
const PUBLIC_PATH = '/api/hospital-admin/auth/login';

/**
 * Attaches the Hospital Admin bearer token, scoped strictly to `/api/hospital-admin/**` requests
 * so it never leaks onto patient or DocTrip-admin calls. See `auth.interceptor.ts`'s matching
 * exclusion of this same path prefix — the two interceptors are mutually exclusive by URL.
 */
export const hospitalAdminAuthInterceptor: HttpInterceptorFn = (req, next) => {
  if (!req.url.includes(HOSPITAL_ADMIN_PATH)) return next(req);

  const auth = inject(HospitalAdminAuthService);
  const router = inject(Router);

  const token = auth.accessToken();
  const authorizedReq = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(authorizedReq).pipe(
    catchError((err: HttpErrorResponse) => {
      const isPublicCall = req.url.includes(PUBLIC_PATH);
      if (err.status === 401 && !isPublicCall) {
        auth.clearSession();
        router.navigate(['/hospital-admin/login']);
      }
      return throwError(() => err);
    }),
  );
};
