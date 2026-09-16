import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HospitalService } from '../../../core/services/hospital.service';
import { ToastService } from '../../../core/services/toast.service';
import { ApiError } from '../../../core/models/auth.model';

/**
 * Add/edit hospital — mirrors the reference mockup's `isForm` screen (sectioned fields: Identity,
 * Location and capacity, International patient desk). One component for both create and edit,
 * matching the mockup's own `goAdd`/`goEdit` sharing a single form screen.
 */
@Component({
  selector: 'app-hospital-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './hospital-form.component.html',
})
export class HospitalFormComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly hospitalService = inject(HospitalService);
  private readonly toast = inject(ToastService);

  protected readonly editing = signal(false);
  protected readonly hospitalId = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal('');
  protected readonly loading = signal(true);

  protected readonly form = this.fb.nonNullable.group({
    name: ['', Validators.required],
    type: ['Multi-speciality'],
    reg: [''],
    accred: [''],
    city: ['', Validators.required],
    region: ['Kerala'],
    beds: this.fb.control<number | null>(null, [Validators.required, Validators.min(0)]),
    person: [''],
    email: ['', Validators.email],
    phone: [''],
  });

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.loading.set(false);
      return;
    }
    this.editing.set(true);
    this.hospitalId.set(id);
    this.hospitalService.get(id).subscribe({
      next: (h) => {
        this.form.patchValue({
          name: h.name,
          type: h.type,
          reg: h.registrationNumber ?? '',
          accred: h.accreditation ?? '',
          city: h.city,
          region: h.state,
          beds: h.beds,
          person: h.contactPerson ?? '',
          email: h.contactEmail ?? '',
          phone: h.contactPhone ?? '',
        });
        this.loading.set(false);
      },
      error: () => {
        this.toast.show('Could not load this hospital.');
        this.loading.set(false);
      },
    });
  }

  save(): void {
    this.serverError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      name: v.name.trim(),
      type: v.type,
      city: v.city.trim(),
      state: v.region,
      registrationNumber: v.reg,
      accreditation: v.accred,
      beds: v.beds,
      contactPerson: v.person,
      contactEmail: v.email,
      contactPhone: v.phone,
    };

    this.submitting.set(true);
    const id = this.hospitalId();
    const call = this.editing() && id ? this.hospitalService.update(id, payload) : this.hospitalService.create(payload);
    call.subscribe({
      next: (h) => {
        this.submitting.set(false);
        this.toast.show(this.editing() ? `${h.name} updated.` : `${h.name} added as ${h.hospitalCode}. Activate it when the contract is signed.`);
        this.router.navigate(['/admin/hospitals', h.id]);
      },
      error: (err: HttpErrorResponse) => {
        this.submitting.set(false);
        const body = err.error as ApiError | undefined;
        this.serverError.set(body?.message || 'Could not save this hospital. Please try again.');
      },
    });
  }

  cancel(): void {
    const id = this.hospitalId();
    if (this.editing() && id) {
      this.router.navigate(['/admin/hospitals', id]);
    } else {
      this.router.navigate(['/admin/hospitals']);
    }
  }
}
