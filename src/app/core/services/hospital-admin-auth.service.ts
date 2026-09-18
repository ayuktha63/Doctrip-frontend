import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { HospitalAdminLoginRequest, HospitalAdminLoginResponse } from '../models/hospital-admin.model';

const ACCESS_TOKEN_KEY = 'doctrip_hadmin_access_token';
const HOSPITAL_ID_KEY = 'doctrip_hadmin_hospital_id';
const HOSPITAL_NAME_KEY = 'doctrip_hadmin_hospital_name';

/**
 * Separate, parallel session store for the Hospital Admin persona — deliberately not sharing any
 * state with the patient `AuthService`. Uses distinct sessionStorage keys so the two sessions can
 * coexist in the same browser tab without clobbering each other. Unlike the patient AuthService,
 * the login response carries no refresh token, so there is no silent-refresh scheduling here —
 * the session simply expires and the guard/interceptor redirect back to login.
 */
@Injectable({ providedIn: 'root' })
export class HospitalAdminAuthService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin`;

  private readonly _accessToken = signal<string | null>(sessionStorage.getItem(ACCESS_TOKEN_KEY));
  private readonly _hospitalId = signal<string | null>(sessionStorage.getItem(HOSPITAL_ID_KEY));
  private readonly _hospitalName = signal<string | null>(sessionStorage.getItem(HOSPITAL_NAME_KEY));

  readonly accessToken = this._accessToken.asReadonly();
  readonly hospitalId = this._hospitalId.asReadonly();
  readonly hospitalName = this._hospitalName.asReadonly();
  readonly isAuthenticated = computed(() => !!this._accessToken());

  login(payload: HospitalAdminLoginRequest): Observable<HospitalAdminLoginResponse> {
    return this.http
      .post<HospitalAdminLoginResponse>(`${this.base}/auth/login`, payload)
      .pipe(tap((res) => this.setSession(res)));
  }

  logout(): void {
    this.clearSession();
  }

  clearSession(): void {
    this._accessToken.set(null);
    this._hospitalId.set(null);
    this._hospitalName.set(null);
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(HOSPITAL_ID_KEY);
    sessionStorage.removeItem(HOSPITAL_NAME_KEY);
  }

  private setSession(res: HospitalAdminLoginResponse): void {
    this._accessToken.set(res.accessToken);
    this._hospitalId.set(res.hospitalId);
    this._hospitalName.set(res.hospitalName);
    sessionStorage.setItem(ACCESS_TOKEN_KEY, res.accessToken);
    sessionStorage.setItem(HOSPITAL_ID_KEY, res.hospitalId);
    sessionStorage.setItem(HOSPITAL_NAME_KEY, res.hospitalName);
  }
}
