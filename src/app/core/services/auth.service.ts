import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AuthResponse,
  LoginOtpRequest,
  LoginRequest,
  OtpChallengeResponse,
  OtpResendRequest,
  OtpVerifyRequest,
  Patient,
  RegisterRequest,
} from '../models/auth.model';

const ACCESS_TOKEN_KEY = 'doctrip_access_token';
const REFRESH_TOKEN_KEY = 'doctrip_refresh_token';
const PATIENT_KEY = 'doctrip_patient';

/** Refresh this many seconds before the access token's actual expiry, so it never lapses mid-session. */
const REFRESH_SKEW_SECONDS = 60;

/** Best-effort decode of a JWT's exp claim (seconds since epoch), no verification. */
function decodeJwtExpiry(token: string): number | null {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json.exp === 'number' ? json.exp * 1000 : null;
  } catch {
    return null;
  }
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly base = `${environment.apiBaseUrl}/api/auth`;
  private readonly patientsBase = `${environment.apiBaseUrl}/api/patients`;

  private readonly _accessToken = signal<string | null>(sessionStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly _refreshToken = signal<string | null>(sessionStorage.getItem(REFRESH_TOKEN_KEY));
  private readonly _patient = signal<Patient | null>(readStoredPatient());
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;

  readonly accessToken = this._accessToken.asReadonly();
  readonly patient = this._patient.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  constructor() {
    // Resume the silent-refresh schedule across a full page reload, not just within one SPA session.
    if (this._accessToken()) this.startExpiryWatch();
  }

  register(payload: RegisterRequest): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${this.base}/register`, payload);
  }

  verifyOtp(payload: OtpVerifyRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/otp/verify`, payload).pipe(tap((res) => this.setSession(res)));
  }

  resendOtp(payload: OtpResendRequest): Observable<void> {
    return this.http.post<void>(`${this.base}/otp/resend`, payload);
  }

  login(payload: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.base}/login`, payload).pipe(tap((res) => this.setSession(res)));
  }

  requestLoginOtp(payload: LoginOtpRequest): Observable<OtpChallengeResponse> {
    return this.http.post<OtpChallengeResponse>(`${this.base}/login/otp`, payload);
  }

  /**
   * Called from the OAuth callback route once the backend redirects back with tokens. Unlike
   * every other auth path, the OAuth redirect can't embed the patient profile in a JSON body
   * (it's a query string on a browser redirect), so this fetches it separately via
   * GET /api/patients/me.
   */
  setSessionFromOAuthCallback(accessToken: string, refreshToken: string): Observable<Patient> {
    this.storeTokens(accessToken, refreshToken);
    this.startExpiryWatch();
    return this.http.get<Patient>(`${this.patientsBase}/me`).pipe(
      tap((patient) => {
        this._patient.set(patient);
        sessionStorage.setItem(PATIENT_KEY, JSON.stringify(patient));
      }),
    );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.base}/logout`, {}).pipe(tap(() => this.clearSession()));
  }

  /** Clears local session without waiting for the server call (used when a refresh fails). */
  clearSession(): void {
    this._accessToken.set(null);
    this._refreshToken.set(null);
    this._patient.set(null);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(PATIENT_KEY);
    this.stopExpiryWatch();
  }

  private setSession(res: AuthResponse): void {
    this.storeTokens(res.accessToken, res.refreshToken);
    this._patient.set(res.patient);
    sessionStorage.setItem(PATIENT_KEY, JSON.stringify(res.patient));
    this.startExpiryWatch();
  }

  private storeTokens(accessToken: string, refreshToken: string): void {
    this._accessToken.set(accessToken);
    this._refreshToken.set(refreshToken);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    sessionStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  /** Proactively swaps the refresh token for a new access/refresh pair shortly before expiry (FR-08). */
  private startExpiryWatch(): void {
    this.stopExpiryWatch();
    const token = this._accessToken();
    if (!token) return;
    const expiresAt = decodeJwtExpiry(token);
    if (!expiresAt) return;

    const delay = Math.max(expiresAt - Date.now() - REFRESH_SKEW_SECONDS * 1000, 0);
    this.refreshTimer = setTimeout(() => this.silentRefresh(), delay);
  }

  private stopExpiryWatch(): void {
    if (this.refreshTimer) {
      clearTimeout(this.refreshTimer);
      this.refreshTimer = null;
    }
  }

  private silentRefresh(): void {
    const refreshToken = this._refreshToken();
    if (!refreshToken) return;
    this.http.post<AuthResponse>(`${this.base}/token/refresh`, { refreshToken }).subscribe({
      next: (res) => this.setSession(res),
      error: () => this.clearSession(),
    });
  }
}

function readStoredPatient(): Patient | null {
  const raw = sessionStorage.getItem(PATIENT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Patient;
  } catch {
    return null;
  }
}
