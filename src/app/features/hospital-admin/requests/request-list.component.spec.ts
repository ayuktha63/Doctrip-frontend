import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RequestListComponent } from './request-list.component';
import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
import { HospitalAdminAuthService } from '../../../core/services/hospital-admin-auth.service';
import { AppointmentRequestSummary } from '../../../core/models/appointment-request.model';

describe('RequestListComponent', () => {
  function setup(
    overrides: {
      listForHospital?: ReturnType<typeof vi.fn>;
      navigate?: ReturnType<typeof vi.fn>;
      hospitalId?: string | null;
    } = {},
  ) {
    const listForHospital = overrides.listForHospital ?? vi.fn(() => of([]));
    const navigate = overrides.navigate ?? vi.fn();
    const hospitalId = overrides.hospitalId ?? 'h1';

    TestBed.configureTestingModule({
      imports: [RequestListComponent],
      providers: [
        { provide: AppointmentRequestService, useValue: { listForHospital } },
        { provide: HospitalAdminAuthService, useValue: { hospitalId: signal(hospitalId) } },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const fixture = TestBed.createComponent(RequestListComponent);
    fixture.detectChanges();
    return { fixture, listForHospital, navigate };
  }

  const summary: AppointmentRequestSummary = {
    id: 'r1',
    requestCode: 'APR-0001',
    patientName: 'Jane Doe',
    patientCountry: 'UAE',
    department: 'Cardiology',
    requestedDoctorName: null,
    requestedDate: '2026-10-01',
    requestedTime: '09:00:00',
    status: 'REQUESTED',
    adminSlaDeadline: '2026-10-01T10:00:00Z',
    adminSlaBreached: false,
  };

  it('loads requests for the logged-in admin\'s hospitalId on init', () => {
    const listForHospital = vi.fn(() => of([summary]));
    const { fixture, listForHospital: called } = setup({ listForHospital });

    expect(called).toHaveBeenCalledWith('h1');
    expect((fixture.componentInstance as any).requests()).toEqual([summary]);
    expect((fixture.componentInstance as any).countLabel()).toBe('1 request');
    expect((fixture.componentInstance as any).loading()).toBe(false);
  });

  it('pluralizes the count label for more than one request', () => {
    const listForHospital = vi.fn(() => of([summary, { ...summary, id: 'r2', requestCode: 'APR-0002' }]));
    const { fixture } = setup({ listForHospital });

    expect((fixture.componentInstance as any).countLabel()).toBe('2 requests');
  });

  it('sets loadError and clears loading when the request list fails', () => {
    const listForHospital = vi.fn(() => throwError(() => new Error('network down')));
    const { fixture } = setup({ listForHospital });

    expect((fixture.componentInstance as any).loadError()).toBe(true);
    expect((fixture.componentInstance as any).loading()).toBe(false);
  });

  it('sets loadError without calling the service when there is no hospitalId', () => {
    const listForHospital = vi.fn(() => of([]));
    const { fixture, listForHospital: called } = setup({ listForHospital, hospitalId: null });

    expect(called).not.toHaveBeenCalled();
    expect((fixture.componentInstance as any).loadError()).toBe(true);
    expect((fixture.componentInstance as any).loading()).toBe(false);
  });

  it('maps every status to a distinct label', () => {
    const { fixture } = setup();
    const c = fixture.componentInstance;
    expect(c.statusOf('REQUESTED').label).toBe('Requested');
    expect(c.statusOf('DOCTOR_COORDINATION').label).toBe('Doctor coordination');
    expect(c.statusOf('DOCTOR_SELECTED').label).toBe('Doctor selected');
    expect(c.statusOf('CONFIRMED').label).toBe('Confirmed');
    expect(c.statusOf('ESCALATED').label).toBe('Escalated');
    expect(c.statusOf('CANCELLED').label).toBe('Cancelled');
  });

  it('flags SLA breach regardless of remaining minutes', () => {
    const { fixture } = setup();
    const c = fixture.componentInstance;
    const breached = { ...summary, adminSlaBreached: true, adminSlaDeadline: new Date(Date.now() + 999999).toISOString() };
    expect(c.slaOf(breached).label).toBe('SLA breached');
  });

  it('navigates to the request detail route when a row is opened', () => {
    const navigate = vi.fn();
    const { fixture } = setup({ navigate });
    fixture.componentInstance.open('r1');
    expect(navigate).toHaveBeenCalledWith(['/hospital-admin/requests', 'r1']);
  });
});
