import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { HospitalAdminHospitalService } from '../../../core/services/hospital-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { HospitalAdminHospital } from '../../../core/models/hospital-admin.model';

@Component({
  selector: 'app-hospital-admin-hospital',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hospital-admin-hospital.component.html',
})
export class HospitalAdminHospitalComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HospitalAdminHospitalService);
  private readonly toast = inject(ToastService);

  protected readonly hospital = signal<HospitalAdminHospital | null>(null);
  protected readonly loading = signal(true);
  protected readonly saving = signal(false);

  protected readonly form = this.fb.nonNullable.group({
    sla: [''],
    coordinationWindow: [''],
    escalationContact: [''],
    languagesSupported: [''],
    minLeadTime: [''],
    interpreterAvailability: [''],
  });

  ngOnInit(): void {
    this.service.get().subscribe((h) => this.hospital.set(h));
    this.service.getOperationalSettings().subscribe({
      next: (settings) => {
        this.form.patchValue({
          sla: settings.sla ?? '',
          coordinationWindow: settings.coordinationWindow ?? '',
          escalationContact: settings.escalationContact ?? '',
          languagesSupported: settings.languagesSupported ?? '',
          minLeadTime: settings.minLeadTime ?? '',
          interpreterAvailability: settings.interpreterAvailability ?? '',
        });
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  save(): void {
    this.saving.set(true);
    this.service.updateOperationalSettings(this.form.getRawValue()).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.show('Operational settings saved.');
      },
      error: () => {
        this.saving.set(false);
        this.toast.show('Could not save operational settings. Please try again.');
      },
    });
  }
}
