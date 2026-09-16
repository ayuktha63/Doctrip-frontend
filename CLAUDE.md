# CLAUDE.md — DocTrip Frontend

Conventions for future work in this repo. Keep this file in sync with what's actually implemented.
Mirrors the sibling `HRMS-frontend` repo's stack and conventions closely (same author's prior
project) — see that repo's own `CLAUDE.md` for the fuller rationale behind each convention.

## Angular version & setup

- Angular 22, scaffolded via `npx @angular/cli@latest new`, esbuild-based `@angular/build` builder.
- Standalone components everywhere — no `NgModule`s. Bootstrap is `app.config.ts` (providers) +
  `app.routes.ts` (routes), wired in `main.ts`.
- `ng test` runs on Vitest, not Karma/Jasmine.
- Dev server runs on **port 4300** (`npm start -- --port 4300`, or the workspace-root
  `.claude/launch.json`'s `doctrip-frontend` config) — `HRMS-frontend` already occupies the
  default :4200 on this machine.

## Architecture

```
src/app/
  core/
    guards/         functional CanActivateFn guards (authGuard, guestGuard)
    interceptors/    functional HttpInterceptorFn (authInterceptor — attaches JWT, handles 401)
    services/        AuthService, ToastService, OtpChallengeStore
    models/          typed request/response interfaces (auth.model.ts)
  shared/
    components/      app-shell (persistent header + router-outlet), toast-host
    validators.ts    strongPasswordValidator / mobileNumberValidator / passwordStrengthScore
  features/
    auth/            AuthPageComponent (sign in / sign up tabs, matches the mockup's single-screen
                      toggle) + otp/ (OtpPageComponent) + callback/ (OAuth2 redirect landing)
    home/            minimal authenticated placeholder — NOT the mockup's "Discover" screen (see
                      "Scope" below)
```

## Design reference — and what's deliberately NOT built yet

The reference design lives in `C:\Users\ASUS\Downloads\doctrip-web-panels 2.html` (a Claude Design
canvas export), specifically the `PatientPanel.dc.html` artboard inside its embedded JSON — it's
the **full DocTrip patient app mockup** (auth, hospital/treatment browsing, booking, appointments,
account settings), not just auth. This repo only implements the **auth slice** (Story 1):

- `AuthPageComponent`/`OtpPageComponent` reproduce the mockup's `isAuth`/`isOtp` screens field-for-
  field, style-for-style (inline styles copied from the mockup almost verbatim, not abstracted into
  a `.card`/`.btn` design-system layer like `HRMS-frontend` uses — pixel fidelity to the mockup was
  an explicit requirement here).
- **"Continue as guest" is intentionally omitted** — the user explicitly said guest login is being
  removed from the product. Don't re-add it even though the mockup has it.
- The header's "Discover" / "My appointments" / "Account" nav items and the notification bell are
  visually present (matching the mockup, which shows this header on every screen including auth)
  but show a "coming soon" toast — those screens (hospital browsing, booking, appointment
  management) are later stories, not built yet. `HomeComponent` is a minimal authenticated
  placeholder proving the auth flow lands somewhere, not an implementation of the mockup's
  "Discover" home screen.
- The mockup's OTP screen copy assumes an SMS-to-mobile code ("Verify your mobile"); this repo's
  copy says "Verify your account" instead, because `Doctrip-backend` actually delivers the
  registration OTP by **email**, not SMS (see backend `CLAUDE.md`'s OTP delivery section) — the
  mockup's wording would be actively misleading here.

## Frontend/backend contract mapping — deliberate deviations from the mockup

The mockup's own client-side validation is looser than what `Doctrip-backend` actually enforces.
Per an explicit instruction to map the two together (add backend fields for anything the frontend
needs, and don't let the frontend under-validate what the backend requires), this repo's
validation was tightened to match the backend exactly, not the mockup:

- **Password**: mockup accepts 8+ chars with a letter and a number. `strongPasswordValidator`
  (`shared/validators.ts`) instead mirrors `Doctrip-backend`'s `PasswordPolicy.isValid` exactly —
  8+ chars, upper, lower, digit, **and** a special character. The strength meter
  (`passwordStrengthScore`) is calibrated to the same stricter policy, not the mockup's original
  scoring.
- **Mobile**: mockup validates a loose 10-digit check after stripping non-digits.
  `mobileNumberValidator` requires exactly `^[0-9]{10}$`, matching `RegisterRequest.mobile`'s
  backend validation (also tightened backend-side to match, from an earlier 7–15-digit range).
- **Terms of Service checkbox**: the mockup has one (`reg.agree`) but the backend originally had
  nowhere to record it. `RegisterRequest.agreeToTerms` (`@AssertTrue`) and `Patient.termsAcceptedAt`
  were added to `Doctrip-backend` specifically because this checkbox exists in the frontend — see
  that repo's `CLAUDE.md` for the backend side of this mapping. `AuthPageComponent`'s registration
  form sends `agreeToTerms: agree` on submit; don't let this drift out of sync if the checkbox ever
  changes.
- If either repo's contract changes again, update both `CLAUDE.md` files together — `auth.model.ts`
  here and `Doctrip-backend`'s `dto/` package are the two sources of truth and must stay aligned by
  hand (no shared codegen between the two repos).

## Session management (mirrors backend FR-08/FR-09)

- `AuthService` stores `accessToken` + `refreshToken` (`sessionStorage`, not `localStorage` —
  matches `HRMS-frontend`'s pattern) plus the last-known `Patient` payload, all as signals.
- **Proactive silent refresh**: unlike `HRMS-frontend` (which just logs the user out on token
  expiry), this decodes the access token's `exp` claim and schedules a `setTimeout` to call
  `POST /api/auth/token/refresh` ~60 seconds before it actually expires (`REFRESH_SKEW_SECONDS`),
  swapping in the new access+refresh pair transparently. If the refresh call itself fails (refresh
  token expired/revoked), the session is cleared and `authInterceptor` redirects to `/auth` on the
  next 401.
- `authInterceptor` still attaches the bearer token and force-clears+redirects on any 401 from a
  non-public endpoint, as a fallback for anything the proactive refresh didn't catch (e.g. server
  revoked the session via logout-elsewhere, or the tab was asleep past expiry).
- **OAuth is the one path that doesn't get patient data inline** — the backend redirect is a bare
  browser navigation with `?token=...&refreshToken=...` in the query string, so
  `OAuthCallbackComponent`/`AuthService.setSessionFromOAuthCallback` makes a follow-up
  `GET /api/patients/me` call to populate the patient signal. Every other auth path (register-
  verify, login, login-otp-verify) gets `{accessToken, refreshToken, patient}` in one response and
  doesn't need this extra call.

## OTP challenge hand-off

`OtpChallengeStore` (a tiny in-memory signal, not persisted) bridges `AuthPageComponent` →
`OtpPageComponent` — carries `{patientId, purpose, target}` between the register/login-otp call and
the verify screen, mirroring the mockup's own in-component state machine (`otpVia`, `reg`,
`loginId`) rather than round-tripping `patientId` through the URL. `OtpPageComponent` redirects back
to `/auth` if it loads with no pending challenge (e.g. a direct deep link to `/auth/otp`).

## Component conventions

- One component per screen, folder-per-feature under `features/`, `.component.ts` + `.component.html`.
- Forms use `ReactiveFormsModule` + `FormBuilder.nonNullable.group(...)`. Custom validators live in
  `shared/validators.ts` as pure `ValidatorFn`s.
- Local UI state (loading, form tab, OTP countdown) uses `signal()`, not `BehaviorSubject`.
- Templates use `@if`/`@for`, not `*ngIf`/`*ngFor`.
- Lazy-loaded routes: every feature route uses `loadComponent`.
- Inline styles are copied near-verbatim from the mockup for anything visual (see "Design
  reference" above) — this repo does NOT use a `styles.scss` utility-class design system the way
  `HRMS-frontend` does, by deliberate choice for pixel fidelity to the mockup.

## Running & testing

```bash
npm install
npm start -- --port 4300
npm run build
npm test
```

## Story 3 — DocTrip Admin & hospital management

A second route tree lives alongside the patient app in this same Angular project — not a separate
app, per an explicit decision to keep one frontend project with `/admin` as its own top-level
route:

```
src/app/
  core/
    services/        HospitalService, ConfirmDialogService (alongside AuthService, ToastService)
    models/          hospital.model.ts (Hospital, HospitalRequest, HospitalSummary) — reuses
                      auth.model.ts's ApiError rather than duplicating it
  shared/
    components/      admin-shell (sidebar + header, its own route tree), confirm-dialog
  features/
    admin/
      dashboard/     stat cards + "recently added" table (top 5 by createdAt desc)
      hospitals/     HospitalListComponent, HospitalDetailComponent, HospitalFormComponent
                      (shared by add + edit)
```

- **No admin authentication.** The reference mockup (`Main.dc.html` artboard inside
  `doctrip-web-panels 2.html`, labelled "Story 3 · Hospital management") has no login screen and
  starts pre-authenticated — see `Doctrip-backend`'s `CLAUDE.md` for why admin auth is deliberately
  out of scope here. `AdminShellComponent`'s profile chip is a static "DocTrip Admin" label, not a
  real session. `/admin` is reachable directly, no guard.
- **Route tree is top-level, not nested under the patient `AppShellComponent`.** `/admin` (with its
  own `AdminShellComponent` sidebar shell) is a sibling of the patient `''` route in
  `app.routes.ts`. The patient `authInterceptor`/`AuthService` are untouched by this story — admin
  calls carry no auth header at all, matching the backend's open `/api/admin/hospitals/**`.
- **`ConfirmDialogService`** is a small signal-based single-dialog service (`open({title, body,
  actionLabel, accent, tint, onConfirm})` / `confirm()` / `close()`) used for the activate/
  deactivate confirmation, matching the mockup's confirm-modal styling (green accent for activate,
  amber for deactivate).
- **Non-goals for this persona, don't build here**: department management, doctor management/
  assignment, availability management, appointment coordination, doctor acknowledgement, patient
  booking. DocTrip Admin only creates/views/edits/activates/deactivates hospital master records —
  see `Doctrip-backend`'s `CLAUDE.md` for the full rationale.

## Constraints / things not to reintroduce

- No "Continue as guest" button or flow — explicitly removed from product scope.
- No mock/fake data in components — every dynamic value comes from a real service call.
- No `NgModule`s, no `*ngIf`/`*ngFor`, no component libraries (Material etc.).
- Don't build the mockup's Discover/booking/appointments/account screens as part of this story —
  they're explicitly out of scope until their own stories land.
