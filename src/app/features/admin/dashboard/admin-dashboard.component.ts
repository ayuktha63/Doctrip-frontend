import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HospitalService } from '../../../core/services/hospital.service';
import { Hospital } from '../../../core/models/hospital.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  templateUrl: './admin-dashboard.component.html',
})
export class AdminDashboardComponent implements OnInit {
  private readonly hospitalService = inject(HospitalService);
  private readonly router = inject(Router);

  protected readonly hospitals = signal<Hospital[]>([]);
  protected readonly loading = signal(true);

  protected readonly activeCount = computed(() => this.hospitals().filter((h) => h.active).length);
  protected readonly inactiveCount = computed(() => this.hospitals().length - this.activeCount());
  protected readonly recent = computed(() =>
    [...this.hospitals()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5),
  );

  ngOnInit(): void {
    this.hospitalService.list().subscribe({
      next: (list) => {
        this.hospitals.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  open(id: string): void {
    this.router.navigate(['/admin/hospitals', id]);
  }

  goHospitals(): void {
    this.router.navigate(['/admin/hospitals']);
  }

  statusOf(h: Hospital): { label: string; fg: string; bg: string } {
    return h.active
      ? { label: 'Active', fg: '#16A34A', bg: '#E7F6EC' }
      : { label: 'Inactive', fg: '#B26A00', bg: '#FFF6E6' };
  }

  formatDate(iso: string): string {
    return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
