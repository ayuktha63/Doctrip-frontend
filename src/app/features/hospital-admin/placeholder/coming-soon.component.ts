import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';

/**
 * Placeholder screen for the Hospital Admin sidebar tabs this story doesn't build (Dashboard,
 * Hospital, Departments, Doctors, Availability) — only "Requests" (FR-01 onward) is functional.
 * Title comes from route `data.title` so one component covers every dummy tab.
 */
@Component({
  selector: 'app-hospital-admin-coming-soon',
  standalone: true,
  template: `
    <div style="max-width: 640px; padding: 60px 0">
      <div style="font-family: Newsreader, Georgia, serif; font-size: 26px; font-weight: 500; letter-spacing: -.4px">{{ title() }}</div>
      <div style="font-size: 13.5px; line-height: 20px; color: #6B7280; margin-top: 10px">
        Not built yet in this story — only "Requests" (appointment-request review and doctor
        coordination) is functional right now.
      </div>
    </div>
  `,
})
export class ComingSoonComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly title = toSignal(this.route.data.pipe(map((d) => (d['title'] as string) ?? 'Coming soon')), {
    initialValue: 'Coming soon',
  });
}
