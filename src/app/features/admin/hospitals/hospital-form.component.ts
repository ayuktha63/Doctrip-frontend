import { Component, OnInit, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map, of, switchMap } from 'rxjs';
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
  protected readonly adminAccountId = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly serverError = signal('');
  protected readonly loading = signal(true);
  protected readonly showAdminPassword = signal(false);

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
    adminName: [''],
    adminEmail: ['', Validators.email],
    adminPassword: [''],
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
    this.hospitalService.getAdminAccounts(id).subscribe({
      next: (accounts) => {
        const account = accounts[0];
        if (account) {
          this.adminAccountId.set(account.id);
          this.form.patchValue({ adminName: account.name, adminEmail: account.email, adminPassword: account.password ?? '' });
        }
      },
      error: () => {}, // Non-fatal — the hospital details themselves still loaded.
    });
  }

  save(): void {
    this.serverError.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const needsNewAdminAccount = !this.editing() || !this.adminAccountId();
    if (needsNewAdminAccount && (!v.adminName.trim() || !v.adminEmail.trim() || !v.adminPassword)) {
      this.form.markAllAsTouched();
      this.serverError.set('Enter a name, email and password for this hospital’s admin login.');
      return;
    }
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
    const adminAccountId = this.adminAccountId();
    if (this.editing() && id) {
      this.hospitalService
        .update(id, payload)
        .pipe(
          switchMap((h) => {
            if (adminAccountId) {
              return this.hospitalService
                .updateAdminAccount(adminAccountId, {
                  name: v.adminName.trim(),
                  email: v.adminEmail.trim(),
                  password: v.adminPassword,
                })
                .pipe(map(() => h));
            }
            if (v.adminName.trim() && v.adminEmail.trim() && v.adminPassword) {
              return this.hospitalService
                .createAdminAccount({ hospitalId: h.id, name: v.adminName.trim(), email: v.adminEmail.trim(), password: v.adminPassword })
                .pipe(map(() => h));
            }
            return of(h);
          }),
        )
        .subscribe({
          next: (h) => {
            this.submitting.set(false);
            this.toast.show(`${h.name} updated.`);
            this.router.navigate(['/admin/hospitals', h.id]);
          },
          error: (err: HttpErrorResponse) => this.handleSaveError(err),
        });
      return;
    }

    this.hospitalService
      .create(payload)
      .pipe(
        switchMap((h) =>
          this.hospitalService.createAdminAccount({
            hospitalId: h.id,
            name: v.adminName.trim(),
            email: v.adminEmail.trim(),
            password: v.adminPassword,
          }).pipe(map(() => h)),
        ),
      )
      .subscribe({
        next: (h) => {
          this.submitting.set(false);
          this.toast.show(
            `${h.name} added as ${h.hospitalCode}, with a Hospital Admin login. Activate it when the contract is signed.`,
          );
          this.router.navigate(['/admin/hospitals', h.id]);
        },
        error: (err: HttpErrorResponse) => this.handleSaveError(err),
      });
  }

  private handleSaveError(err: HttpErrorResponse): void {
    this.submitting.set(false);
    const body = err.error as ApiError | undefined;
    this.serverError.set(body?.message || 'Could not save this hospital. Please try again.');
  }

  toggleAdminPasswordVisibility(): void {
    this.showAdminPassword.update((v) => !v);
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
