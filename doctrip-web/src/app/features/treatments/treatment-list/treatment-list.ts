import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TreatmentsService } from '../treatments.service';
import { TreatmentPackage, isPubliclyVisible } from '../treatment-package.model';

type LoadState = 'loading' | 'loaded' | 'error';

/**
 * FE-WEB-2.1 — Public Treatment Package Discovery (listing only).
 *
 * Scope boundary: this component only lists treatment packages and lets
 * a visitor select one. It does not render package details (FE-WEB-2.2),
 * does not implement booking, login/signup, authentication handoff, or
 * discovery-context preservation.
 */
@Component({
  selector: 'app-treatment-list',
  imports: [],
  templateUrl: './treatment-list.html',
  styleUrl: './treatment-list.scss',
})
export class TreatmentList {
  private readonly treatmentsService = inject(TreatmentsService);
  private readonly router = inject(Router);

  private readonly state = signal<LoadState>('loading');
  private readonly packages = signal<TreatmentPackage[]>([]);
  private readonly errorMessage = signal<string | null>(null);

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasError = computed(() => this.state() === 'error');

  // Business rule (story_2.md): only approved/published records are shown.
  // Inactive/unapproved records are filtered out here as a discovery-side
  // safeguard; the authoritative filtering is expected server-side once
  // the backend contract exists.
  readonly visiblePackages = computed(() => this.packages().filter(isPubliclyVisible));

  readonly isEmpty = computed(
    () => this.state() === 'loaded' && this.visiblePackages().length === 0,
  );

  readonly currentError = this.errorMessage.asReadonly();

  constructor() {
    this.load();
  }

  load(): void {
    this.state.set('loading');
    this.errorMessage.set(null);

    this.treatmentsService.getTreatmentPackages().subscribe({
      next: (packages) => {
        this.packages.set(packages);
        this.state.set('loaded');
      },
      error: (err: Error) => {
        this.errorMessage.set(err.message);
        this.state.set('error');
      },
    });
  }

  // Selection affordance only (story_2.md: "Visitor/Patient can select a
  // package"). Navigating to a treatment package's detail route is wired
  // here, but the destination view itself is out of scope for FE-WEB-2.1
  // and is implemented in FE-WEB-2.2.
  selectPackage(pkg: TreatmentPackage): void {
    this.router.navigate(['/treatments', pkg.id]);
  }
}
