import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { HospitalAdminDashboardService } from '../../../core/services/hospital-admin-dashboard.service';
import { DashboardAttentionItem, DashboardSummary, RequestStatus } from '../../../core/models/hospital-admin.model';

interface PipelineStage {
  label: string;
  value: number;
  accent: string;
  pct: string;
}

const STATUS_META: Record<RequestStatus, { label: string; fg: string; bg: string }> = {
  NEW: { label: 'New request', fg: '#0B4EAE', bg: '#E7EFFC' },
  IN_COORDINATION: { label: 'In coordination', fg: '#6D28D9', bg: '#F0EAFB' },
  AWAITING_DOCTOR: { label: 'Awaiting doctor', fg: '#B45309', bg: '#FDF3E3' },
  AWAITING_PATIENT: { label: 'Awaiting patient', fg: '#0D726D', bg: '#E3F2F1' },
  CONFIRMED: { label: 'Confirmed', fg: '#0E7C4A', bg: '#E6F4EC' },
  CANCELLED: { label: 'Cancelled', fg: '#B42318', bg: '#FBECEA' },
};

/**
 * Coordination desk — ports the mockup's `isDash` screen (HospitalAdmin.dc.html ~lines 1096-1225)
 * against a new backend endpoint (GET /api/hospital-admin/dashboard/summary) that did not exist
 * for this story's original scope; see CLAUDE.md's Story 4 section for the backend-prompt history.
 * Shows a friendly empty state rather than fake numbers if the endpoint isn't live yet (404/500).
 */
@Component({
  selector: 'app-hospital-admin-dashboard',
  standalone: true,
  templateUrl: './hospital-admin-dashboard.component.html',
})
export class HospitalAdminDashboardComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly service = inject(HospitalAdminDashboardService);

  protected readonly summary = signal<DashboardSummary | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadFailed = signal(false);

  protected readonly tiles = computed(() => {
    const k = this.summary()?.kpis;
    if (!k) return [];
    return [
      { label: 'New appointment requests', value: k.newRequests, sub: 'not picked up', accent: '#0F62D6' },
      { label: 'Requests in coordination', value: k.inCoordination, sub: 'with the desk', accent: '#6D28D9' },
      { label: 'Awaiting doctor response', value: k.awaitingDoctor, sub: 'sent to consultants', accent: '#B45309' },
      { label: 'Awaiting patient confirmation', value: k.awaitingPatient, sub: 'proposal sent', accent: '#0D726D' },
      { label: 'Upcoming appointments', value: k.upcomingAppointments, sub: 'confirmed and paid', accent: '#0E7C4A' },
      { label: 'SLA alerts', value: k.slaBreaches, sub: 'past the window', accent: '#B42318' },
    ];
  });

  protected readonly pipeline = computed<PipelineStage[]>(() => {
    const p = this.summary()?.pipeline;
    if (!p) return [];
    const stages: [string, number, string][] = [
      ['New request', p.newRequests, '#0F62D6'],
      ['In coordination', p.inCoordination, '#6D28D9'],
      ['Awaiting doctor', p.awaitingDoctor, '#B45309'],
      ['Awaiting patient', p.awaitingPatient, '#0D726D'],
      ['Confirmed', p.confirmed, '#0E7C4A'],
      ['Cancelled', p.cancelled, '#B42318'],
    ];
    const total = stages.reduce((sum, [, v]) => sum + v, 0) || 1;
    return stages.map(([label, value, accent]) => ({ label, value, accent, pct: `${(value / total) * 100}%` }));
  });

  protected readonly pipelineTotal = computed(() => this.pipeline().reduce((sum, p) => sum + p.value, 0));

  ngOnInit(): void {
    this.service.getSummary().subscribe({
      next: (summary) => {
        this.summary.set(summary);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
        this.loadFailed.set(true);
      },
    });
  }

  statusLabel(status: RequestStatus): string {
    return STATUS_META[status].label;
  }

  statusFg(status: RequestStatus): string {
    return STATUS_META[status].fg;
  }

  statusBg(status: RequestStatus): string {
    return STATUS_META[status].bg;
  }

  slaLabel(item: DashboardAttentionItem): string {
    const m = item.slaMinutesRemaining;
    return m < 0 ? `${Math.abs(m)}m over` : `${m}m left`;
  }

  slaColor(item: DashboardAttentionItem): string {
    return item.slaMinutesRemaining < 0 ? '#B42318' : '#697585';
  }

  initialsOf(name: string): string {
    return name
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  formatWhen(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  goRequests(): void {
    this.router.navigate(['/hospital-admin/requests']);
  }
}
