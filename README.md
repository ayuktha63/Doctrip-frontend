# Doctrip-frontend

Frontend for DocTrip — patient registration, login, and account management (Story 1).

## Story 1 — Patient Registration, Login & Account Management

Auth UI matching `Doctrip-backend`'s FR-01..FR-10 backend, built against the reference design
(`doctrip-web-panels 2.html`'s `PatientPanel.dc.html` artboard):

- [x] Sign in / sign up screen (password login, registration, Google/Apple OAuth buttons)
- [x] OTP verification screen (registration and login), with resend cooldown countdown
- [x] Session management (access + rotating refresh token, silent proactive refresh)
- [x] Logout
- [x] OAuth callback route
- [ ] "Continue as guest" — intentionally **not** built; guest login is being removed from the
      product per explicit product decision
- [ ] Discover (hospital/treatment browsing), My appointments, Account — later stories; the header
      shows these nav items (matching the mockup) but they show a "coming soon" toast for now

See `CLAUDE.md` for architecture, conventions, and the frontend/backend contract mapping.

## Running

```bash
npm install
npm start -- --port 4300  # ng serve — HRMS-frontend already uses the default :4200 on this
                            # machine; the workspace-root .claude/launch.json's "doctrip-frontend"
                            # config also serves on :4300
npm run build                # production build to dist/doctrip-frontend
npm test                      # unit tests (Vitest)
```

Requires `Doctrip-backend` running at `http://localhost:8081` (see that repo's README) with
`CORS_ALLOWED_ORIGIN` set to this app's dev server origin.
