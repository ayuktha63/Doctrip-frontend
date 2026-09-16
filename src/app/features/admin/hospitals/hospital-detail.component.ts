import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HospitalService } from '../../../core/services/hospital.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Hospital } from '../../../core/models/hospital.model';

@Component({
  selector: 'app-hospital-detail',
  standalone: true,
  templateUrl: './hospital-detail.component.html',
})
export class HospitalDetailComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hospitalService = inject(HospitalService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  protected readonly hospital = signal<Hospital | null>(null);
  protected readonly loading = signal(true);
  protected readonly notFound = signal(false);

  protected readonly master = computed(() => {
    const h = this.hospital();
    if (!h) return [];
    return [
      { k: 'Hospital type', v: h.type },
      { k: 'Registration number', v: h.registrationNumber || '—' },
      { k: 'Accreditation', v: h.accreditation || '—' },
      { k: 'Beds', v: String(h.beds) },
      { k: 'City', v: h.city },
      { k: 'State', v: h.state },
    ];
  });

  protected readonly contact = computed(() => {
    const h = this.hospital();
    if (!h) return [];
    return [
      { k: 'Contact person', v: h.contactPerson || '—' },
      { k: 'Email', v: h.contactEmail || '—' },
      { k: 'Phone', v: h.contactPhone || '—' },
    ];
  });

  protected readonly record = computed(() => {
    const h = this.hospital();
    if (!h) return [];
    return [
      { k: 'Hospital ID', v: h.hospitalCode },
      { k: 'Status', v: h.active ? 'Active' : 'Inactive' },
      { k: 'Added on', v: this.formatDate(h.createdAt) },
      { k: 'Last updated', v: this.formatDate(h.updatedAt) },
    ];
  });

  protected readonly statusFg = computed(() => (this.hospital()?.active ? '#16A34A' : '#B26A00'));
  protected readonly statusBg = computed(() => (this.hospital()?.active ? '#E7F6EC' : '#FFF6E6'));
  protected readonly statusLabel = computed(() => (this.hospital()?.active ? 'Active' : 'Inactive'));
  protected readonly statusNote = computed(() =>
    this.hospital()?.active
      ? 'Listed in patient search and open to new appointment requests.'
      : 'Hidden from patient search. Existing appointments are unaffected.',
  );
  protected readonly toggleLabel = computed(() => (this.hospital()?.active ? 'Deactivate' : 'Activate'));
  protected readonly toggleFg = computed(() => (this.hospital()?.active ? '#B26A00' : '#16A34A'));
  protected readonly toggleBorder = computed(() => (this.hospital()?.active ? '#F0DFBE' : '#CFE9D8'));

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.notFound.set(true);
      this.loading.set(false);
      return;
    }
    this.hospitalService.get(id).subscribe({
      next: (h) => {
        this.hospital.set(h);
        this.loading.set(false);
      },
      error: () => {
        this.notFound.set(true);
        this.loading.set(false);
      },
    });
  }

  goHospitals(): void {
    this.router.navigate(['/admin/hospitals']);
  }

  goEdit(): void {
    const h = this.hospital();
    if (h) this.router.navigate(['/admin/hospitals', h.id, 'edit']);
  }

  askToggle(): void {
    const h = this.hospital();
    if (!h) return;
    const turningOff = h.active;
    this.confirmDialog.open({
      title: turningOff ? `Deactivate ${h.name}?` : `Activate ${h.name}?`,
      body: turningOff
        ? 'It disappears from patient search and stops accepting new appointment requests. Appointments already in coordination are not touched, and the record stays on file.'
        : 'It becomes visible in patient search and can start accepting appointment requests.',
      actionLabel: turningOff ? 'Deactivate' : 'Activate',
      accent: turningOff ? '#B26A00' : '#16A34A',
      tint: turningOff ? '#FFF6E6' : '#E7F6EC',
      onConfirm: () => this.doToggle(h),
    });
  }

  private doToggle(h: Hospital): void {
    const next = !h.active;
    this.hospitalService.setStatus(h.id, { active: next }).subscribe({
      next: (updated) => {
        this.hospital.set(updated);
        this.toast.show(`${h.name} is now ${next ? 'active and visible to patients' : 'inactive and hidden from patients'}.`);
      },
      error: () => this.toast.show('Could not update hospital status. Please try again.'),
    });
  }

  private formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
