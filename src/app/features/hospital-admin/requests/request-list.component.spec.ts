import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RequestListComponent } from './request-list.component';
import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
import { HospitalAdminContextService } from '../../../core/services/hospital-admin-context.service';
import { AppointmentRequestSummary } from '../../../core/models/appointment-request.model';
import { Hospital } from '../../../core/models/hospital.model';

describe('RequestListComponent', () => {
  const hospital: Hospital = {
    id: 'h1',
    hospitalCode: 'HSP-0001',
    name: 'Aster Medcity',
    type: 'Multi-speciality',
    city: 'Kochi',
    state: 'Kerala',
    registrationNumber: null,
    accreditation: null,
    beds: 100,
    contactPerson: null,
    contactEmail: null,
    contactPhone: null,
    active: true,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  };

  function setup(overrides: { listForHospital?: ReturnType<typeof vi.fn>; navigate?: ReturnType<typeof vi.fn> } = {}) {
    const hospitalSignal = signal<Hospital | null>(null);
    const ensureLoaded = vi.fn();
    const listForHospital = overrides.listForHospital ?? vi.fn(() => of([]));
    const navigate = overrides.navigate ?? vi.fn();

    TestBed.configureTestingModule({
      imports: [RequestListComponent],
      providers: [
        { provide: AppointmentRequestService, useValue: { listForHospital } },
        {
          provide: HospitalAdminContextService,
          useValue: { hospital: hospitalSignal, loading: signal(false), loadError: signal(false), ensureLoaded },
        },
        { provide: Router, useValue: { navigate } },
      ],
    });

    const fixture = TestBed.createComponent(RequestListComponent);
    fixture.detectChanges();
    return { fixture, hospitalSignal, listForHospital, ensureLoaded, navigate };
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

  it('calls context.ensureLoaded on init and does not fetch requests until a hospital resolves', () => {
    const { ensureLoaded, listForHospital } = setup();
    expect(ensureLoaded).toHaveBeenCalled();
    expect(listForHospital).not.toHaveBeenCalled();
  });

  it('loads requests once the hospital context resolves, keyed by that hospital id', () => {
    const listForHospital = vi.fn(() => of([summary]));
    const { fixture, hospitalSignal } = setup({ listForHospital });

    hospitalSignal.set(hospital);
    fixture.detectChanges();

    expect(listForHospital).toHaveBeenCalledWith('h1');
    expect((fixture.componentInstance as any).requests()).toEqual([summary]);
    expect((fixture.componentInstance as any).countLabel()).toBe('1 request');
    expect((fixture.componentInstance as any).loading()).toBe(false);
  });

  it('pluralizes the count label for more than one request', () => {
    const listForHospital = vi.fn(() => of([summary, { ...summary, id: 'r2', requestCode: 'APR-0002' }]));
    const { fixture, hospitalSignal } = setup({ listForHospital });

    hospitalSignal.set(hospital);
    fixture.detectChanges();

    expect((fixture.componentInstance as any).countLabel()).toBe('2 requests');
  });

  it('sets loadError and clears loading when the request list fails', () => {
    const listForHospital = vi.fn(() => throwError(() => new Error('network down')));
    const { fixture, hospitalSignal } = setup({ listForHospital });

    hospitalSignal.set(hospital);
    fixture.detectChanges();

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
