import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TranslatePipe } from '../../shared/pipes/translate.pipe';

/**
 * The reference mockup's "Discover" home screen (hospital/treatment browsing) belongs to a later
 * story — this is a minimal authenticated placeholder proving the auth flow actually lands
 * somewhere, not a stand-in implementation of Discover itself.
 */
@Component({
  selector: 'app-home',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  protected readonly patient = this.auth.patient;

  logout(): void {
    this.auth.logout().subscribe(() => this.router.navigate(['/auth']));
  }
}
