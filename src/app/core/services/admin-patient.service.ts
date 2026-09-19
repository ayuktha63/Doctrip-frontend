import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface AdminPatient {
  id: string;
  fullName: string;
  email: string | null;
  mobile: string | null;
  emailVerified: boolean;
  mobileVerified: boolean;
  status: string;
  authProviders: string[];
  createdAt: string;
}

/** DocTrip Admin's "Users" screen — every registered patient, web or mobile. */
@Injectable({ providedIn: 'root' })
export class AdminPatientService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/admin/patients`;

  list(): Observable<AdminPatient[]> {
    return this.http.get<AdminPatient[]>(this.base);
  }
}
