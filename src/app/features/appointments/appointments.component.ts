import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentsStateService } from '../../core/services/appointments-state.service';

/** My appointments — the reference mockup's `isAppts` screen (list of requests/bookings). */
@Component({
  selector: 'app-appointments',
  standalone: true,
  templateUrl: './appointments.component.html',
})
export class AppointmentsComponent {
  protected readonly state = inject(AppointmentsStateService);
  private readonly router = inject(Router);

  protected readonly appointments = this.state.decoratedAppointments;

  protected readonly countLabel = computed(() => {
    const list = this.state.appointments();
    const waiting = list.filter((a) => a.status === 'awaitingPatient').length;
    return `${list.length} appointments · ${waiting} waiting on you`;
  });

  open(id: string): void {
    this.router.navigate(['/appointments', id]);
  }
}
