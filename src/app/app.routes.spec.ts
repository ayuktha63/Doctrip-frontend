import { routes } from './app.routes';

/**
 * FE-WEB-2.13 — Public Discovery Access and Protected Booking Boundary.
 *
 * story_2.md: "Treatment, hospital and doctor discovery does not require
 * authentication." The discovery route (the unified /discover page)
 * now shares app.routes.ts with Story 1 (auth) and Story 3 (admin),
 * both of which use canActivate guards — this guards against a future
 * edit accidentally nesting /discover under one of those guards.
 */
describe('Discovery routing boundary (FE-WEB-2.13)', () => {
  const shellChildren = routes.find((r) => r.path === '' && r.children)?.children ?? [];

  it('does not guard the discover route', () => {
    const discover = shellChildren.find((r) => r.path === 'discover');
    expect(discover).toBeDefined();
    expect(discover?.canActivate, 'discover must not have canActivate').toBeUndefined();
    expect(discover?.canMatch, 'discover must not have canMatch').toBeUndefined();
  });

  it('does guard /home (Story 1 — authenticated patient home feed)', () => {
    const home = shellChildren.find((r) => r.path === 'home');
    expect(home?.canActivate).toBeDefined();
  });
});
