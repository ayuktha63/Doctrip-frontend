import { Component, OnInit, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentsStateService } from '../../core/services/appointments-state.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';
import { TranslationService } from '../../core/services/translation.service';

/** My appointments — the reference mockup's `isAppts` screen (list of requests/bookings), backed
 * by the signed-in patient's own real appointment requests. */
@Component({
  selector: 'app-appointments',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './appointments.component.html',
})
export class AppointmentsComponent implements OnInit {
  protected readonly state = inject(AppointmentsStateService);
  private readonly router = inject(Router);
  private readonly translation = inject(TranslationService);

  protected readonly appointments = this.state.decoratedAppointments;
  protected readonly loading = this.state.loading;
  protected readonly loadError = this.state.loadError;

  protected readonly countLabel = computed(() => {
    const list = this.state.appointments();
    const waiting = list.filter((a) => a.status === 'awaitingPatient').length;
    return this.translation
      .translate('appointments.countLabel')
      .replace('{count}', String(list.length))
      .replace('{waiting}', String(waiting));
  });

  ngOnInit(): void {
    this.state.load();
  }

  open(id: string): void {
    this.router.navigate(['/appointments', id]);
  }
}
