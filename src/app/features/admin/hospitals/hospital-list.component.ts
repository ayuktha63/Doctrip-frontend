import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HospitalService } from '../../../core/services/hospital.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Hospital } from '../../../core/models/hospital.model';

type StatusFilter = 'All' | 'Active' | 'Inactive';

@Component({
  selector: 'app-hospital-list',
  standalone: true,
  templateUrl: './hospital-list.component.html',
})
export class HospitalListComponent implements OnInit {
  private readonly hospitalService = inject(HospitalService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly hospitals = signal<Hospital[]>([]);
  protected readonly loading = signal(true);
  protected readonly q = signal('');
  protected readonly filter = signal<StatusFilter>('All');
  protected readonly filters: StatusFilter[] = ['All', 'Active', 'Inactive'];

  protected readonly rows = computed(() => {
    const query = this.q().trim().toLowerCase();
    return this.hospitals()
      .filter((h) => this.filter() === 'All' || (this.filter() === 'Active') === h.active)
      .filter((h) => !query || `${h.name} ${h.hospitalCode} ${h.city} ${h.type}`.toLowerCase().includes(query));
  });

  protected readonly countLabel = computed(() => {
    const total = this.hospitals().length;
    const active = this.hospitals().filter((h) => h.active).length;
    const shown = this.rows().length;
    return shown === total
      ? `${total} hospitals · ${active} active, ${total - active} inactive`
      : `Showing ${shown} of ${total} hospitals`;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.hospitalService.list().subscribe({
      next: (list) => {
        this.hospitals.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  onQueryInput(event: Event): void {
    this.q.set((event.target as HTMLInputElement).value);
  }

  pickFilter(filter: StatusFilter): void {
    this.filter.set(filter);
  }

  open(id: string): void {
    this.router.navigate(['/admin/hospitals', id]);
  }

  goAdd(): void {
    this.router.navigate(['/admin/hospitals/new']);
  }

  statusOf(h: Hospital): { label: string; fg: string; bg: string } {
    return h.active
      ? { label: 'Active', fg: '#16A34A', bg: '#E7F6EC' }
      : { label: 'Inactive', fg: '#B26A00', bg: '#FFF6E6' };
  }

  toggleOf(h: Hospital): { label: string; fg: string; border: string } {
    return h.active
      ? { label: 'Deactivate', fg: '#B26A00', border: '#F0DFBE' }
      : { label: 'Activate', fg: '#16A34A', border: '#CFE9D8' };
  }

  askToggle(h: Hospital, event: Event): void {
    event.stopPropagation();
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
        this.hospitals.update((list) => list.map((x) => (x.id === updated.id ? updated : x)));
        this.toast.show(`${h.name} is now ${next ? 'active and visible to patients' : 'inactive and hidden from patients'}.`);
      },
      error: () => this.toast.show('Could not update hospital status. Please try again.'),
    });
  }
}
