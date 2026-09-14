/**
 * FE-WEB-2.11 — Preserve Discovery Context During Authentication.
 *
 * The discovery selections story_2.md says must be "retained where
 * applicable" across the authentication handoff (story_2.md — Booking
 * Entry: "The selected discovery context, such as treatment package,
 * hospital, department or doctor, shall be retained where applicable").
 *
 * All fields are optional because only the context "applicable" to the
 * booking action actually being taken is known — today, only treatment
 * package details expose a booking affordance (FE-WEB-2.2/2.9), so only
 * `treatmentPackageId` is ever populated in practice. `hospitalId`,
 * `department`, and `doctorId` exist on this model so the same
 * preservation mechanism can carry them once hospital/doctor booking
 * entry points exist; they are not fabricated data.
 *
 * This is a UI-only carrier, not a backend contract — it never leaves
 * the browser (see BookingHandoffService, which mirrors it into the
 * `/login` redirect's query params so it survives the handoff).
 */
export interface DiscoveryContext {
  treatmentPackageId?: string;
  hospitalId?: string;
  department?: string;
  doctorId?: string;
}

const CONTEXT_KEYS: readonly (keyof DiscoveryContext)[] = [
  'treatmentPackageId',
  'hospitalId',
  'department',
  'doctorId',
];

/** Drops undefined/empty fields so only applicable context is carried. */
export function compactDiscoveryContext(context: DiscoveryContext): Record<string, string> {
  const compacted: Record<string, string> = {};
  for (const key of CONTEXT_KEYS) {
    const value = context[key];
    if (value) {
      compacted[key] = value;
    }
  }
  return compacted;
}

export function readDiscoveryContext(params: {
  get(name: string): string | null;
}): DiscoveryContext {
  const context: DiscoveryContext = {};
  for (const key of CONTEXT_KEYS) {
    const value = params.get(key);
    if (value) {
      context[key] = value;
    }
  }
  return context;
}

export function isDiscoveryContextEmpty(context: DiscoveryContext): boolean {
  return CONTEXT_KEYS.every((key) => !context[key]);
}
