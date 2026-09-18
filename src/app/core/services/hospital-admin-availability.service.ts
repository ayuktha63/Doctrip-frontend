import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AvailabilityRequest, AvailabilitySlot } from '../models/hospital-admin.model';

/** No edit/PUT for availability — only add (POST) and remove (DELETE), matching the mockup. */
@Injectable({ providedIn: 'root' })
export class HospitalAdminAvailabilityService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiBaseUrl}/api/hospital-admin/doctors`;

  list(doctorId: string): Observable<AvailabilitySlot[]> {
    return this.http.get<AvailabilitySlot[]>(`${this.base}/${doctorId}/availability`);
  }

  add(doctorId: string, payload: AvailabilityRequest): Observable<AvailabilitySlot> {
    return this.http.post<AvailabilitySlot>(`${this.base}/${doctorId}/availability`, payload);
  }

  remove(doctorId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/${doctorId}/availability/${id}`);
  }
}
