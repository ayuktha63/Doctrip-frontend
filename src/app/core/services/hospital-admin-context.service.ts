import { Injectable, inject, signal } from '@angular/core';
import { HospitalService } from './hospital.service';
import { Hospital } from '../models/hospital.model';

/**
 * Which hospital the Hospital Admin coordination desk is currently scoped to. There's no
 * Hospital-Admin login/session in this story (see backend CLAUDE.md — admin auth is a future
 * story for both the DocTrip Admin and Hospital Admin personas), so this just picks the first
 * hospital returned by DocTrip Admin's hospital list rather than resolving it from a real session.
 * Replace with a real session-derived hospitalId once Hospital Admin auth exists.
 */
@Injectable({ providedIn: 'root' })
export class HospitalAdminContextService {
  private readonly hospitalService = inject(HospitalService);

  readonly hospital = signal<Hospital | null>(null);
  readonly loading = signal(true);
  readonly loadError = signal(false);

  private loadStarted = false;

  ensureLoaded(): void {
    if (this.loadStarted) return;
    this.loadStarted = true;
    this.hospitalService.list().subscribe({
      next: (hospitals) => {
        this.hospital.set(hospitals[0] ?? null);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }
}
