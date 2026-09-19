import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalAdminDoctorService } from '../../../core/services/hospital-admin-doctor.service';
import { HospitalAdminDepartmentService } from '../../../core/services/hospital-admin-department.service';
import { HospitalAdminHospitalService } from '../../../core/services/hospital-admin.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Department, Doctor } from '../../../core/models/hospital-admin.model';
import { ApiError } from '../../../core/models/auth.model';

@Component({
  selector: 'app-hospital-admin-doctors',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hospital-admin-doctors.component.html',
})
export class HospitalAdminDoctorsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HospitalAdminDoctorService);
  private readonly departmentService = inject(HospitalAdminDepartmentService);
  private readonly hospitalService = inject(HospitalAdminHospitalService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  /** DocTrip Admin's "Hide data" toggle — greys out this whole screen when true (see this
   * hospital's own hospital-detail component in the DocTrip Admin console for where it's set). */
  protected readonly dataHidden = this.hospitalService.dataHidden;

  protected readonly doctors = signal<Doctor[]>([]);
  protected readonly departments = signal<Department[]>([]);
  protected readonly loading = signal(true);
  protected readonly showForm = signal(false);
  protected readonly editing = signal<Doctor | null>(null);
  protected readonly formErr = signal('');
  protected readonly saving = signal(false);
  protected readonly activeCount = computed(() => this.doctors().filter((d) => d.active).length);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    departmentId: ['', Validators.required],
    specialty: ['', Validators.required],
    experienceYears: this.fb.control<number | null>(null, Validators.required),
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.hospitalService.refreshDataHidden();
    this.departmentService.list().subscribe((list) => this.departments.set(list));
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => {
        this.doctors.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdd(): void {
    this.editing.set(null);
    this.formErr.set('');
    this.form.reset({ name: '', departmentId: '', specialty: '', experienceYears: null, email: '' });
    this.showForm.set(true);
  }

  openEdit(d: Doctor): void {
    this.editing.set(d);
    this.formErr.set('');
    this.form.reset({
      name: d.name,
      departmentId: d.departmentId,
      specialty: d.specialty,
      experienceYears: d.experienceYears,
      email: d.email ?? '',
    });
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.formErr.set('');
    const payload = this.form.getRawValue();
    const editing = this.editing();
    const req = editing ? this.service.update(editing.id, payload) : this.service.create(payload);
    req.subscribe({
      next: () => {
        this.saving.set(false);
        this.showForm.set(false);
        this.toast.show(editing ? 'Doctor updated.' : 'Doctor added.');
        this.load();
      },
      error: (err: { error?: ApiError }) => {
        this.saving.set(false);
        this.formErr.set(err.error?.message ?? 'Could not save doctor.');
      },
    });
  }

  initialsOf(name: string): string {
    return name
      .replace(/^Dr\.\s*/, '')
      .split(' ')
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  askToggle(d: Doctor): void {
    const turningOff = d.active;
    this.confirmDialog.open({
      title: turningOff ? `Mark ${d.name} on leave?` : `Mark ${d.name} active?`,
      body: turningOff
        ? 'They stop appearing as available for new appointment coordination while on leave.'
        : 'They become available again for appointment coordination.',
      actionLabel: turningOff ? 'On leave' : 'Active',
      accent: turningOff ? '#B45309' : '#0E7C4A',
      tint: turningOff ? '#FDF3E3' : '#E6F4EC',
      onConfirm: () => {
        this.service.setStatus(d.id, { active: !d.active }).subscribe({
          next: () => {
            this.toast.show(`${d.name} is now ${!d.active ? 'active' : 'on leave'}.`);
            this.load();
          },
          error: () => this.toast.show('Could not update doctor status.'),
        });
      },
    });
  }

  goAvailability(d: Doctor): void {
    this.router.navigate(['/hospital-admin/availability'], { queryParams: { doctorId: d.id } });
  }
}
