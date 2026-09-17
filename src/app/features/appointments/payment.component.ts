import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentsStateService } from '../../core/services/appointments-state.service';

/** Payment — the reference mockup's `isPay` screen (simulated gateway, then confirmation). */
@Component({
  selector: 'app-payment',
  standalone: true,
  templateUrl: './payment.component.html',
})
export class PaymentComponent {
  protected readonly state = inject(AppointmentsStateService);
  private readonly router = inject(Router);

  protected readonly processing = computed(() => this.state.pay() === 'processing');
  protected readonly done = computed(() => this.state.pay() === 'done');

  protected readonly confirmRows = computed(() => {
    const cur = this.state.currentAppointment();
    return [
      { k: 'Reference', v: cur.id },
      { k: 'Hospital', v: cur.hospital },
      { k: 'Department', v: cur.dept },
      { k: 'Doctor', v: cur.doctor },
      { k: 'Date and time', v: cur.when },
      { k: 'Amount paid', v: '₹1,21,000' },
    ];
  });

  completePayment(): void {
    this.state.completePayment();
  }

  viewAppointment(): void {
    this.router.navigate(['/appointments', this.state.currentAppointmentId()]);
  }
}
