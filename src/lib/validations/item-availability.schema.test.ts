/**
 * Marking an order line out of stock.
 *
 * The date is the whole value of the feature. "We don't have it" without one
 * is worse than saying nothing, and the reassurance that the order is NOT
 * cancelled only lands if there is a date attached.
 */
import { describe, expect, it, vi, afterEach } from 'vitest';
import {
  inDays,
  itemAvailabilitySchema,
  localToday,
  toApiDate,
} from './item-availability.schema';

const valid = (overrides: Record<string, unknown> = {}) => ({
  expectedAvailabilityDate: inDays(4),
  availabilityNote: '',
  holdForStock: false,
  ...overrides,
});

afterEach(() => {
  vi.useRealTimers();
});

describe('the expected date', () => {
  it('accepts a date in the future', () => {
    expect(itemAvailabilitySchema.safeParse(valid()).success).toBe(true);
  });

  it('refuses an empty date', () => {
    expect(
      itemAvailabilitySchema.safeParse(valid({ expectedAvailabilityDate: '' })).success,
    ).toBe(false);
  });

  it('refuses a date in the past', () => {
    expect(
      itemAvailabilitySchema.safeParse(valid({ expectedAvailabilityDate: inDays(-1) })).success,
    ).toBe(false);
  });

  it('refuses today, which tells the customer nothing', () => {
    // If it were ready today it would not be being marked unavailable.
    expect(
      itemAvailabilitySchema.safeParse(valid({ expectedAvailabilityDate: localToday() })).success,
    ).toBe(false);
  });

  it('accepts tomorrow', () => {
    expect(
      itemAvailabilitySchema.safeParse(valid({ expectedAvailabilityDate: inDays(1) })).success,
    ).toBe(true);
  });
});

describe('timezone handling', () => {
  it('uses the shop’s local date, not UTC', () => {
    // The trap: `new Date('2026-11-01')` is midnight UTC, which is still the
    // 31st in London and already the 1st in Pune. Comparing parsed Dates would
    // reject a date the shop considers perfectly valid - or accept one it does
    // not. Comparing yyyy-mm-dd strings sidesteps it entirely.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T23:30:00+05:30'));

    expect(localToday()).toBe('2026-11-01');
    expect(itemAvailabilitySchema.safeParse(valid({ expectedAvailabilityDate: '2026-11-02' })).success).toBe(true);
    expect(itemAvailabilitySchema.safeParse(valid({ expectedAvailabilityDate: '2026-11-01' })).success).toBe(false);
  });

  it('pads single-digit months and days', () => {
    // '2026-1-5' sorts before '2026-01-06' as a string and would break every
    // comparison in this file.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-05T12:00:00'));
    expect(localToday()).toBe('2026-01-05');
    expect(inDays(1)).toBe('2026-01-06');
  });

  it('rolls over a month boundary', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-01-30T12:00:00'));
    expect(inDays(4)).toBe('2026-02-03');
  });
});

describe('the note', () => {
  it('is optional', () => {
    expect(itemAvailabilitySchema.safeParse(valid({ availabilityNote: undefined })).success).toBe(
      true,
    );
  });

  it('accepts something a customer would understand', () => {
    expect(
      itemAvailabilitySchema.safeParse(valid({ availabilityNote: 'The new batch is still curing.' }))
        .success,
    ).toBe(true);
  });

  it('refuses an essay, matching the API limit', () => {
    expect(
      itemAvailabilitySchema.safeParse(valid({ availabilityNote: 'x'.repeat(301) })).success,
    ).toBe(false);
  });
});

describe('the hold-or-split choice', () => {
  it('must be an actual boolean', () => {
    // It decides what the customer is told will happen, so a truthy string
    // quietly meaning "hold" is not good enough.
    expect(itemAvailabilitySchema.safeParse(valid({ holdForStock: 'yes' })).success).toBe(false);
  });

  it('accepts either choice', () => {
    expect(itemAvailabilitySchema.safeParse(valid({ holdForStock: true })).success).toBe(true);
    expect(itemAvailabilitySchema.safeParse(valid({ holdForStock: false })).success).toBe(true);
  });
});

describe('toApiDate', () => {
  it('sends the END of the chosen day', () => {
    // The API refuses a date that is not in the future, and midnight *today*
    // is already past by the time anyone presses save. A shop saying "ready on
    // the 1st" means some time during the 1st.
    const iso = toApiDate('2026-11-01');
    const parsed = new Date(iso);
    expect(parsed.getHours()).toBe(23);
    expect(parsed.getMinutes()).toBe(59);
  });

  it('produces a date the API will accept for tomorrow', () => {
    expect(new Date(toApiDate(inDays(1))).getTime()).toBeGreaterThan(Date.now());
  });

  it('is still in the future for a date chosen earlier today', () => {
    // The real failure this guards: picking "today + 1" at 23:50 must not
    // round down to something already past.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-11-01T23:50:00'));
    expect(new Date(toApiDate(inDays(1))).getTime()).toBeGreaterThan(Date.now());
  });
});
