import { Component } from '@angular/core';

/**
 * The mockup shows "Requests" under Coordination with an unread-count badge, but per the Story 4
 * brief this must NOT be wired to any backend — that's a separate future story. Nav chrome stays
 * (see hospital-admin-shell), this route is a plain "coming soon" placeholder, no HTTP calls.
 */
@Component({
  selector: 'app-hospital-admin-requests',
  standalone: true,
  templateUrl: './hospital-admin-requests.component.html',
})
export class HospitalAdminRequestsComponent {}
