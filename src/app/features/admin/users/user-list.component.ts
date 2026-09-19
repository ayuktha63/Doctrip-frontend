import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AdminPatient, AdminPatientService } from '../../../core/services/admin-patient.service';

type StatusFilter = 'All' | 'Active' | 'Pending';

/** DocTrip Admin's "Users" screen — every registered patient, whether they signed up through the
 *  web frontend or the mobile app (both authenticate against the same Story 1 API). */
@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './user-list.component.html',
})
export class UserListComponent implements OnInit {
  private readonly adminPatientService = inject(AdminPatientService);

  protected readonly patients = signal<AdminPatient[]>([]);
  protected readonly loading = signal(true);
  protected readonly loadError = signal(false);
  protected readonly q = signal('');
  protected readonly filter = signal<StatusFilter>('All');
  protected readonly filters: StatusFilter[] = ['All', 'Active', 'Pending'];

  protected readonly rows = computed(() => {
    const query = this.q().trim().toLowerCase();
    return this.patients()
      .filter((p) => this.filter() === 'All' || (this.filter() === 'Active') === (p.status === 'active'))
      .filter(
        (p) => !query || `${p.fullName} ${p.email ?? ''} ${p.mobile ?? ''}`.toLowerCase().includes(query),
      );
  });

  protected readonly countLabel = computed(() => {
    const total = this.patients().length;
    const active = this.patients().filter((p) => p.status === 'active').length;
    const shown = this.rows().length;
    return shown === total
      ? `${total} users · ${active} active, ${total - active} pending verification`
      : `Showing ${shown} of ${total} users`;
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.adminPatientService.list().subscribe({
      next: (list) => {
        this.patients.set(list);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set(true);
        this.loading.set(false);
      },
    });
  }

  onQueryInput(event: Event): void {
    this.q.set((event.target as HTMLInputElement).value);
  }

  pickFilter(filter: StatusFilter): void {
    this.filter.set(filter);
  }

  statusOf(p: AdminPatient): { label: string; fg: string; bg: string } {
    return p.status === 'active'
      ? { label: 'Active', fg: '#16A34A', bg: '#E7F6EC' }
      : { label: 'Pending verification', fg: '#B26A00', bg: '#FFF6E6' };
  }

  /** Signed up via email/password vs Google/Apple OAuth — the closest real signal to "channel"
   *  this backend has; there is no separate mobile-vs-web flag since both clients hit the same API. */
  channelOf(p: AdminPatient): string {
    if (p.authProviders.length === 0) return 'Email';
    return p.authProviders.map((provider) => provider[0] + provider.slice(1).toLowerCase()).join(', ');
  }

  initialsOf(name: string): string {
    return name
      .split(' ')
      .filter(Boolean)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }
}
