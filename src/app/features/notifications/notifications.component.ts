import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AppointmentsStateService } from '../../core/services/appointments-state.service';

/** Notifications — the reference mockup's `isNotifs` screen, reached from the header bell. */
@Component({
  selector: 'app-notifications',
  standalone: true,
  templateUrl: './notifications.component.html',
})
export class NotificationsComponent {
  protected readonly state = inject(AppointmentsStateService);
  private readonly router = inject(Router);

  protected readonly notifications = computed(() => {
    const read = this.state.notifRead();
    return this.state.notifications().map((n, i) => ({
      ...n,
      unread: !read && i < 3,
      bg: !read && i < 3 ? '#fff' : '#FBFCFE',
    }));
  });

  protected readonly countLabel = computed(() => `${this.state.unreadCount()} unread`);

  open(to: string): void {
    this.router.navigate(['/appointments', to]);
  }

  markAllRead(): void {
    this.state.markAllRead();
  }
}
