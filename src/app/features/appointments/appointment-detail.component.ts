import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AppointmentStatus } from '../../core/models/appointment.model';
import { AppointmentsStateService } from '../../core/services/appointments-state.service';
import { ConfirmDialogService } from '../../core/services/confirm-dialog.service';
import { ToastService } from '../../core/services/toast.service';

interface ActionButton {
  label: string;
  bg: string;
  fg: string;
  border: string;
  run: () => void;
}

const PRIMARY = { bg: '#1A6DF0', fg: '#fff', border: '#1A6DF0' };
const DANGER = { bg: '#fff', fg: '#DC2626', border: '#F1D6D6' };

/** Appointment detail — the reference mockup's `isAppt` screen (fields, progress timeline, actions). */
@Component({
  selector: 'app-appointment-detail',
  standalone: true,
  templateUrl: './appointment-detail.component.html',
})
export class AppointmentDetailComponent {
  protected readonly state = inject(AppointmentsStateService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  private readonly routeId = toSignal(this.route.paramMap.pipe(map((p) => p.get('id'))), { initialValue: null });

  constructor() {
    // Keeps the viewed appointment in sync with the :id route param even if Angular reuses this
    // component instance across param-only navigations (e.g. browser back/forward).
    effect(() => {
      const id = this.routeId();
      if (id) this.state.loadDetail(id);
    });
  }

  protected readonly cur = this.state.currentAppointment;
  protected readonly detailLoading = this.state.detailLoading;

  protected readonly proposalReady = computed(() => {
    const status = this.cur().status;
    return status === 'awaitingPatient' || status === 'confirmed';
  });

  protected readonly detailTitle = computed(() =>
    this.proposalReady() ? 'Your coordinated appointment' : 'What you requested',
  );
  protected readonly detailHint = computed(() =>
    this.proposalReady()
      ? 'Acknowledged by the doctor. This is what you are confirming.'
      : 'The hospital may propose a different doctor or time.',
  );

  protected readonly fields = computed(() => {
    const cur = this.cur();
    const [date, time] = cur.when.split(', ');
    const ready = this.proposalReady();
    return [
      { k: 'Hospital', v: cur.hospital },
      { k: 'Department', v: cur.dept },
      { k: ready ? 'Doctor' : 'Requested doctor', v: cur.doctor },
      { k: ready ? 'Date' : 'Preferred date', v: date },
      { k: ready ? 'Time' : 'Preferred time', v: time },
      { k: 'Reference', v: cur.code },
    ];
  });

  protected readonly timeline = computed(() =>
    this.cur().log.map((e, i, log) => ({
      title: e.title,
      body: e.body,
      time: e.time,
      accent: /Cancel/.test(e.title) ? '#DC2626' : /[Cc]onfirmed|ready/.test(e.title) ? '#16A34A' : '#1A6DF0',
      tint: /Cancel/.test(e.title) ? '#FCECEC' : /[Cc]onfirmed|ready/.test(e.title) ? '#E7F6EC' : '#EAF1FE',
      line: i === log.length - 1 ? 'transparent' : '#EEF2F8',
    })),
  );

  private static readonly STATUS_NOTE: Record<AppointmentStatus, string> = {
    requested: 'The hospital has your request and will assign a consultant.',
    coordinating: 'The hospital is matching a consultant and a slot to your dates.',
    awaitingPatient: 'A doctor has acknowledged this slot. Confirm to book it.',
    confirmed: 'Booked. Your confirmation is in your email.',
    cancelled: 'This request was cancelled.',
    expired: 'No consultant became available for this request, so it closed.',
  };

  protected readonly statusNote = computed(() => AppointmentDetailComponent.STATUS_NOTE[this.cur().status]);

  protected readonly actions = computed<ActionButton[]>(() => {
    const cur = this.cur();
    const status = cur.status;
    const acts: ActionButton[] = [];
    if (status === 'awaitingPatient') {
      acts.push({ label: 'Confirm appointment', run: () => this.confirmAppointment(), ...PRIMARY });
      acts.push({ label: 'Cancel appointment', run: () => this.askCancel(), ...DANGER });
    } else if (status === 'requested' || status === 'coordinating') {
      acts.push({ label: 'Cancel request', run: () => this.askCancel(), ...DANGER });
    } else if (status === 'confirmed') {
      acts.push({ label: 'Cancel appointment', run: () => this.askCancel(), ...DANGER });
    }
    return acts;
  });

  goAppointments(): void {
    this.router.navigate(['/appointments']);
  }

  confirmAppointment(): void {
    this.state.confirm(this.cur().id).subscribe({
      next: () => this.toast.show('Appointment confirmed.'),
      error: (err) => this.toast.show(err.error?.message ?? 'Could not confirm this appointment.'),
    });
  }

  askCancel(): void {
    const cur = this.cur();
    const confirmed = cur.status === 'confirmed';
    this.confirmDialog.open({
      title: confirmed ? 'Cancel this appointment?' : 'Cancel this request?',
      body: confirmed
        ? `The hospital releases your ${cur.when} slot.`
        : 'The hospital stops coordinating this request.',
      actionLabel: confirmed ? 'Cancel appointment' : 'Cancel request',
      accent: '#DC2626',
      tint: '#FCECEC',
      onConfirm: () => this.state.cancel(cur.id),
    });
  }
}
