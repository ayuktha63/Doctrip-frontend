import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { HospitalAdminAuthService } from '../services/hospital-admin-auth.service';

export const hospitalAdminAuthGuard: CanActivateFn = () => {
  const auth = inject(HospitalAdminAuthService);
  const router = inject(Router);
  if (auth.isAuthenticated()) return true;
  router.navigate(['/hospital-admin/login']);
  return false;
};
