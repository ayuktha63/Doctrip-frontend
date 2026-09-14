import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

/**
 * Minimal passthrough error interceptor.
 *
 * UNDEFINED: no backend exists yet, so there is no real error shape
 * (status codes, error body format) to normalize against. This only
 * establishes the interception boundary; mapping to UI error/unavailable
 * states (docs/story_2.md — Notifications/User Feedback) is implemented
 * per-subtask (see FE-WEB-2.12) once the backend contract is known.
 */
export const httpErrorInterceptor: HttpInterceptorFn = (req, next) =>
  next(req).pipe(catchError((error: HttpErrorResponse) => throwError(() => error)));
