import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { RequestDetailComponent } from './request-detail.component';
import { AppointmentRequestService } from '../../../core/services/appointment-request.service';
import { ToastService } from '../../../core/services/toast.service';
import { AppointmentRequestDetail, DoctorAvailability } from '../../../core/models/appointment-request.model';

describe('RequestDetailComponent', () => {
  const baseDetail: AppointmentRequestDetail = {
    id: 'r1',
    requestCode: 'APR-0001',
    patientId: 'p1',
    patientName: 'Jane Doe',
    patientCountry: 'UAE',
    patientAge: 30,
    patientGender: 'Female',
    hospitalId: 'h1',
    hospitalName: 'Aster Medcity',
    department: 'Cardiology',
    requestedDoctorName: null,
    requestedDate: '2026-10-01',
    requestedTime: '09:00:00',
    healthcareRequirement: 'Consultation',
    additionalInfo: null,
    requiredDocuments: [],
    status: 'REQUESTED',
    adminSlaDeadline: '2026-10-01T10:00:00Z',
    adminSlaBreached: false,
    createdAt: '2026-09-30T09:00:00Z',
    updatedAt: '2026-09-30T09:00:00Z',
    coordination: [],
    securedDoctorName: null,
    securedDate: null,
    securedTime: null,
  };

  const availability: DoctorAvailability = {
    requestedDoctorName: null,
    requestedDoctorAvailable: false,
    eligibleDoctors: [{ doctorId: 'd1', name: 'Dr. Anil Kumar', specialty: 'Cardiology' }],
  };

  function setup(overrides: {
    id?: string | null;
    get?: ReturnType<typeof vi.fn>;
    doctorAvailability?: ReturnType<typeof vi.fn>;
    startCoordination?: ReturnType<typeof vi.fn>;
    resolveAlternative?: ReturnType<typeof vi.fn>;
  } = {}) {
    const get = overrides.get ?? vi.fn(() => of(baseDetail));
    const doctorAvailability = overrides.doctorAvailability ?? vi.fn(() => of(availability));
    const startCoordination = overrides.startCoordination ?? vi.fn(() => of({ ...baseDetail, status: 'DOCTOR_COORDINATION' }));
    const resolveAlternative = overrides.resolveAlternative ?? vi.fn(() => of({ ...baseDetail, status: 'DOCTOR_SELECTED' }));
    const navigate = vi.fn();
    const toastShow = vi.fn();

    TestBed.configureTestingModule({
      imports: [RequestDetailComponent],
      providers: [
        { provide: AppointmentRequestService, useValue: { get, doctorAvailability, startCoordination, resolveAlternative } },
        { provide: ToastService, useValue: { show: toastShow } },
        { provide: Router, useValue: { navigate } },
        {
          provide: ActivatedRoute,
          useValue: { snapshot: { paramMap: convertToParamMap(overrides.id === undefined ? { id: 'r1' } : overrides.id ? { id: overrides.id } : {}) } },
        },
      ],
    });

    const fixture = TestBed.createComponent(RequestDetailComponent);
    fixture.detectChanges();
    return { fixture, get, doctorAvailability, startCoordination, resolveAlternative, navigate, toastShow };
  }

  it('redirects back to the list if no id is present in the route', () => {
    const { navigate, get } = setup({ id: null });
    expect(navigate).toHaveBeenCalledWith(['/hospital-admin/requests']);
    expect(get).not.toHaveBeenCalled();
  });

  it('loads the request detail and, since status is REQUESTED, also loads doctor availability', () => {
    const { fixture, get, doctorAvailability } = setup();
    expect(get).toHaveBeenCalledWith('r1');
    expect(doctorAvailability).toHaveBeenCalledWith('r1');
    expect((fixture.componentInstance as any).request()).toEqual(baseDetail);
    expect((fixture.componentInstance as any).availability()).toEqual(availability);
  });

  it('does not load availability once coordination has already started', () => {
    const get = vi.fn(() => of({ ...baseDetail, status: 'DOCTOR_COORDINATION' as const }));
    const doctorAvailability = vi.fn(() => of(availability));
    setup({ get, doctorAvailability });
    expect(doctorAvailability).not.toHaveBeenCalled();
  });

  it('sets loadError when the detail request fails', () => {
    const get = vi.fn(() => throwError(() => new Error('not found')));
    const { fixture } = setup({ get });
    expect((fixture.componentInstance as any).loadError()).toBe(true);
    expect((fixture.componentInstance as any).loading()).toBe(false);
  });

  it('starts coordination, updates the request, and toasts a fan-out summary', () => {
    const startCoordination = vi.fn(() =>
      of({
        ...baseDetail,
        status: 'DOCTOR_COORDINATION' as const,
        coordination: [
          {
            id: 'a1',
            doctorId: 'd1',
            doctorName: 'Dr. Anil Kumar',
            doctorSpecialty: 'Cardiology',
            status: 'PENDING' as const,
            sentAt: '2026-10-01T09:00:00Z',
            responseDeadline: '2026-10-01T09:15:00Z',
            proposedDate: null,
            proposedTime: null,
          },
          {
            id: 'a2',
            doctorId: 'd2',
            doctorName: 'Dr. Priya Nair',
            doctorSpecialty: 'Cardiology',
            status: 'PENDING' as const,
            sentAt: '2026-10-01T09:00:00Z',
            responseDeadline: '2026-10-01T09:15:00Z',
            proposedDate: null,
            proposedTime: null,
          },
        ],
      }),
    );
    const { fixture, toastShow } = setup({ startCoordination });

    fixture.componentInstance.startCoordination();

    expect(startCoordination).toHaveBeenCalledWith('r1');
    expect((fixture.componentInstance as any).request().status).toBe('DOCTOR_COORDINATION');
    expect((fixture.componentInstance as any).starting()).toBe(false);
    expect(toastShow).toHaveBeenCalledWith('Acknowledgement requests sent to 2 eligible doctors.');
  });

  it('toasts a single-doctor summary when the requested doctor was available', () => {
    const startCoordination = vi.fn(() =>
      of({
        ...baseDetail,
        requestedDoctorName: 'Dr. Anil Kumar',
        status: 'DOCTOR_COORDINATION' as const,
        coordination: [
          {
            id: 'a1',
            doctorId: 'd1',
            doctorName: 'Dr. Anil Kumar',
            doctorSpecialty: 'Cardiology',
            status: 'PENDING' as const,
            sentAt: '2026-10-01T09:00:00Z',
            responseDeadline: '2026-10-01T09:15:00Z',
            proposedDate: null,
            proposedTime: null,
          },
        ],
      }),
    );
    const { fixture, toastShow } = setup({ startCoordination });

    fixture.componentInstance.startCoordination();

    expect(toastShow).toHaveBeenCalledWith('Acknowledgement request sent to Dr. Anil Kumar.');
  });

  it('toasts the server error message when starting coordination fails', () => {
    const startCoordination = vi.fn(() => throwError(() => ({ error: { message: 'No eligible doctors are available.' } })));
    const { fixture, toastShow } = setup({ startCoordination });

    fixture.componentInstance.startCoordination();

    expect(toastShow).toHaveBeenCalledWith('No eligible doctors are available.');
    expect((fixture.componentInstance as any).starting()).toBe(false);
  });

  it('resolves the earliest alternative and toasts the secured doctor/slot', () => {
    const resolveAlternative = vi.fn(() =>
      of({ ...baseDetail, status: 'DOCTOR_SELECTED' as const, securedDoctorName: 'Dr. Priya Nair', securedDate: '2026-10-05', securedTime: '14:00:00' }),
    );
    const { fixture, toastShow } = setup({ resolveAlternative });

    fixture.componentInstance.resolveAlternative();

    expect(resolveAlternative).toHaveBeenCalledWith('r1');
    expect(toastShow).toHaveBeenCalledWith('Secured Dr. Priya Nair for 2026-10-05 14:00:00.');
    expect((fixture.componentInstance as any).resolving()).toBe(false);
  });

  it('only surfaces ALTERNATIVE_PROPOSED acks as pending alternatives', () => {
    const detailWithMixedAcks: AppointmentRequestDetail = {
      ...baseDetail,
      status: 'DOCTOR_COORDINATION',
      coordination: [
        {
          id: 'a1',
          doctorId: 'd1',
          doctorName: 'Dr. A',
          doctorSpecialty: null,
          status: 'ALTERNATIVE_PROPOSED',
          sentAt: '2026-10-01T09:00:00Z',
          responseDeadline: '2026-10-01T09:15:00Z',
          proposedDate: '2026-10-05',
          proposedTime: '10:00:00',
        },
        {
          id: 'a2',
          doctorId: 'd2',
          doctorName: 'Dr. B',
          doctorSpecialty: null,
          status: 'PENDING',
          sentAt: '2026-10-01T09:00:00Z',
          responseDeadline: '2026-10-01T09:15:00Z',
          proposedDate: null,
          proposedTime: null,
        },
      ],
    };
    const { fixture } = setup({ get: vi.fn(() => of(detailWithMixedAcks)) });

    expect((fixture.componentInstance as any).alternativeProposals()).toHaveLength(1);
    expect((fixture.componentInstance as any).alternativeProposals()[0].id).toBe('a1');
  });

  it('maps every status to a human label', () => {
    const { fixture } = setup();
    const c = fixture.componentInstance;
    (fixture.componentInstance as any).request.set({ ...baseDetail, status: 'DOCTOR_SELECTED' });
    expect(c.statusLabel()).toBe('Doctor selected');
    (fixture.componentInstance as any).request.set({ ...baseDetail, status: 'ESCALATED' });
    expect(c.statusLabel()).toBe('Escalated');
    (fixture.componentInstance as any).request.set({ ...baseDetail, status: 'CANCELLED' });
    expect(c.statusLabel()).toBe('Cancelled');
    (fixture.componentInstance as any).request.set({ ...baseDetail, status: 'CONFIRMED' });
    expect(c.statusLabel()).toBe('Confirmed');
  });

  it('navigates back to the request list', () => {
    const { fixture, navigate } = setup();
    fixture.componentInstance.goBack();
    expect(navigate).toHaveBeenCalledWith(['/hospital-admin/requests']);
  });
});
