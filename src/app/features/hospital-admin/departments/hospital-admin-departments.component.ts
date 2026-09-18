import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { HospitalAdminDepartmentService } from '../../../core/services/hospital-admin-department.service';
import { ConfirmDialogService } from '../../../core/services/confirm-dialog.service';
import { ToastService } from '../../../core/services/toast.service';
import { Department } from '../../../core/models/hospital-admin.model';
import { ApiError } from '../../../core/models/auth.model';
import { deptArtFor } from '../../../shared/dept-art';

/**
 * List + add/edit form combined in one component (an inline modal, not a separate route/component
 * like Story 3's HospitalFormComponent) — a deliberate simplification given this story's four
 * near-identical CRUD screens (departments/doctors/treatments/availability); the modal styling
 * mirrors the mockup's own modal pattern regardless.
 */
@Component({
  selector: 'app-hospital-admin-departments',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hospital-admin-departments.component.html',
})
export class HospitalAdminDepartmentsComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly service = inject(HospitalAdminDepartmentService);
  private readonly confirmDialog = inject(ConfirmDialogService);
  private readonly toast = inject(ToastService);

  protected readonly departments = signal<Department[]>([]);
  protected readonly loading = signal(true);
  protected readonly showForm = signal(false);
  protected readonly editing = signal<Department | null>(null);
  protected readonly formErr = signal('');
  protected readonly saving = signal(false);
  protected readonly activeCount = computed(() => this.departments().filter((d) => d.active).length);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    code: ['', Validators.required],
    head: ['', Validators.required],
  });

  ngOnInit(): void {
    this.load();
  }

  private load(): void {
    this.loading.set(true);
    this.service.list().subscribe({
      next: (list) => {
        this.departments.set(list);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openAdd(): void {
    this.editing.set(null);
    this.formErr.set('');
    this.form.reset({ name: '', code: '', head: '' });
    this.showForm.set(true);
  }

  openEdit(d: Department): void {
    this.editing.set(d);
    this.formErr.set('');
    this.form.reset({ name: d.name, code: d.code, head: d.head });
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
        this.toast.show(editing ? 'Department updated.' : 'Department created.');
        this.load();
      },
      error: (err: { error?: ApiError }) => {
        this.saving.set(false);
        this.formErr.set(err.error?.message ?? 'Could not save department.');
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

  askToggle(d: Department): void {
    const turningOff = d.active;
    this.confirmDialog.open({
      title: turningOff ? `Deactivate ${d.name}?` : `Activate ${d.name}?`,
      body: turningOff
        ? 'It stops accepting new doctor assignments and treatment listings while inactive.'
        : 'It becomes active and available for doctor assignments and treatments again.',
      actionLabel: turningOff ? 'Deactivate' : 'Activate',
      accent: turningOff ? '#B45309' : '#0E7C4A',
      tint: turningOff ? '#FDF3E3' : '#E6F4EC',
      onConfirm: () => {
        this.service.setStatus(d.id, { active: !d.active }).subscribe({
          next: () => {
            this.toast.show(`${d.name} is now ${!d.active ? 'active' : 'inactive'}.`);
            this.load();
          },
          error: () => this.toast.show('Could not update department status.'),
        });
      },
    });
  }
}
