import { z } from 'zod';

/**
 * Marking one line of an order out of stock.
 *
 * The date is required and must be in the future, mirroring the API. Telling a
 * customer "we don't have it" without saying when is worse than saying nothing
 * at all - and the reassurance that the order is NOT cancelled only lands if
 * there is a date attached to it.
 */
export const itemAvailabilitySchema = z.object({
  /**
   * A plain `yyyy-mm-dd` from a date input, not an ISO timestamp. Compared as
   * a string against today's local date rather than parsed: `new Date('2026-11-01')`
   * is midnight UTC, which is yesterday for anyone east of Greenwich and would
   * reject a date the shop considers perfectly valid.
   */
  expectedAvailabilityDate: z
    .string()
    .min(1, 'Give a date the customer can expect')
    .refine((value) => value > localToday(), {
      message: 'Pick a date in the future - a date already past tells the customer nothing',
    }),

  availabilityNote: z
    .string()
    .max(300, 'Keep it under 300 characters')
    .optional()
    .or(z.literal('')),

  /** true holds the whole order; false ships what is ready and sends the rest on. */
  holdForStock: z.boolean(),
});

export type ItemAvailabilityFormValues = z.infer<typeof itemAvailabilitySchema>;

/** Today in the shop's own timezone, as `yyyy-mm-dd`. */
export function localToday(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

/** `yyyy-mm-dd` for a date n days from today, for the quick presets. */
export function inDays(n: number): string {
  const date = new Date();
  date.setDate(date.getDate() + n);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

/**
 * The end of the chosen day, as an ISO timestamp for the API.
 *
 * End of day rather than midnight: the API refuses a date that is not in the
 * future, and midnight *today* is in the past by the time anyone presses save.
 * A shop saying "ready on the 1st" means some time on the 1st.
 */
export function toApiDate(yyyymmdd: string): string {
  return new Date(`${yyyymmdd}T23:59:59`).toISOString();
}
