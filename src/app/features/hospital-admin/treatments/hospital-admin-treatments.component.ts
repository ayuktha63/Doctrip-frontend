import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HospitalAdminTreatmentService } from '../../../core/services/hospital-admin-treatment.service';
import { HospitalAdminDepartmentService } from '../../../core/services/hospital-admin-department.service';
import { HospitalAdminHospitalService } from '../../../core/services/hospital-admin.service';
import { ToastService } from '../../../core/services/toast.service';
import { Department, Treatment } from '../../../core/models/hospital-admin.model';
import { ApiError } from '../../../core/models/auth.model';
import { deptArtFor } from '../../../shared/dept-art';

@Component({
  selector: 'app-hospital-admin-treatments',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hospital-admin-treatments.component.html',
})
export class HospitalAdminTreatmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HospitalAdminTreatmentService);
  private readonly departmentService = inject(HospitalAdminDepartmentService);
  private readonly hospitalService = inject(HospitalAdminHospitalService);
  private readonly toast = inject(ToastService);

  protected readonly dataHidden = this.hospitalService.dataHidden;

  protected readonly treatments = signal<Treatment[]>([]);
  protected readonly departments = signal<Department[]>([]);
  protected readonly loading = signal(true);
  protected readonly showForm = signal(false);
  protected readonly editing = signal<Treatment | null>(null);
  protected readonly formErr = signal('');
  protected readonly saving = signal(false);

  /** What Treatment Discovery actually shows for this hospital right now. */
  protected readonly listedTreatments = computed(() => this.treatments().filter((t) => t.listed));

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    departmentId: ['', Validators.required],
    price: this.fb.control<number | null>(null, Validators.required),
    consultationFee: this.fb.control<number | null>(null, Validators.required),
    typicalStay: ['', Validators.required],
    description: [''],
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
        this.treatments.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdd(): void {
    this.editing.set(null);
    this.formErr.set('');
    this.form.reset({ name: '', departmentId: '', price: null, consultationFee: null, typicalStay: '', description: '' });
    this.showForm.set(true);
  }

  openEdit(t: Treatment): void {
    this.editing.set(t);
    this.formErr.set('');
    this.form.reset({
      name: t.name,
      departmentId: t.departmentId,
      price: t.price,
      consultationFee: t.consultationFee,
      typicalStay: t.typicalStay,
      description: t.description,
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
        this.toast.show(editing ? 'Treatment updated.' : 'Treatment created.');
        this.load();
      },
      error: (err: { error?: ApiError }) => {
        this.saving.set(false);
        this.formErr.set(err.error?.message ?? 'Could not save treatment.');
      },
    });
  }

  deptTint(name: string): string {
    return deptArtFor(name).tint;
  }

  deptAccent(name: string): string {
    return deptArtFor(name).accent;
  }

  deptIcon(name: string): string {
    return deptArtFor(name).icon;
  }

  deptCodeFor(name: string): string {
    return this.departments().find((d) => d.name === name)?.code ?? name.slice(0, 3).toUpperCase();
  }

  toggleListed(t: Treatment): void {
    this.service.setStatus(t.id, { active: !t.listed }).subscribe({
      next: () => {
        this.toast.show(`${t.name} is now ${!t.listed ? 'listed' : 'unlisted'}.`);
        this.load();
      },
      error: () => this.toast.show('Could not update treatment listing.'),
    });
  }
}
