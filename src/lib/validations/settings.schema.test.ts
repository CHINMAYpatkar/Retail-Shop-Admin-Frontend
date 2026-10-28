/**
 * Storefront chrome settings (SF-30, SF-31).
 *
 * These five forms are the only way to change the customer site's logo,
 * announcement bar, USP strip, home headings and footer without editing JSON
 * in the database. The storefront reads all of them defensively, so a bad
 * value here does not break the site - it makes the change silently do
 * nothing, which to whoever pressed Save looks exactly like a bug.
 */
import { describe, expect, it } from 'vitest';
import {
  announcementSchema,
  brandingSchema,
  footerSchema,
  homeSectionsSchema,
  uspStripSchema,
} from './settings.schema';

const announcement = (overrides: Record<string, unknown> = {}) => ({
  enabled: true,
  message: 'Free delivery across Pune this week',
  linkLabel: '',
  linkUrl: '',
  ...overrides,
});

describe('announcement bar', () => {
  it('accepts an enabled bar with a message', () => {
    expect(announcementSchema.safeParse(announcement()).success).toBe(true);
  });

  it('refuses to enable a bar with nothing to say', () => {
    // The storefront renders nothing without a message, so saving this would
    // look like the toggle did not work.
    const result = announcementSchema.safeParse(announcement({ message: '' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['message']);
    }
  });

  it('treats a whitespace-only message as empty', () => {
    expect(announcementSchema.safeParse(announcement({ message: '   ' })).success).toBe(false);
  });

  it('allows an empty message when the bar is off', () => {
    // Turning the bar off should not require first writing copy for it.
    expect(
      announcementSchema.safeParse(announcement({ enabled: false, message: '' })).success,
    ).toBe(true);
  });

  it('accepts a complete link', () => {
    expect(
      announcementSchema.safeParse(
        announcement({ linkLabel: 'See the range', linkUrl: '/shop' }),
      ).success,
    ).toBe(true);
  });

  it('refuses a label with no URL', () => {
    // Renders as plain text on the storefront - a call to action that does
    // nothing when clicked.
    const result = announcementSchema.safeParse(announcement({ linkLabel: 'See the range' }));
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toEqual(['linkUrl']);
    }
  });

  it('refuses a URL with no label', () => {
    expect(announcementSchema.safeParse(announcement({ linkUrl: '/shop' })).success).toBe(false);
  });

  it('accepts neither half, which means no link at all', () => {
    expect(announcementSchema.safeParse(announcement()).success).toBe(true);
  });

  it('requires the enabled flag to be a real boolean', () => {
    expect(announcementSchema.safeParse(announcement({ enabled: 'yes' })).success).toBe(false);
  });
});

describe('branding', () => {
  it('accepts a shop with no logo uploaded yet', () => {
    // The wordmark is the fallback, so an empty logo is a normal state, not
    // an incomplete form.
    expect(
      brandingSchema.safeParse({ logoUrl: '', faviconUrl: '', wordmark: 'Retail Shop' }).success,
    ).toBe(true);
  });

  it('accepts uploaded paths as the media library returns them', () => {
    expect(
      brandingSchema.safeParse({
        logoUrl: '/uploads/branding/logo.png',
        faviconUrl: '/uploads/branding/favicon.ico',
        wordmark: '',
      }).success,
    ).toBe(true);
  });
});

describe('USP strip', () => {
  it('accepts an empty list, which is how the strip is cleared', () => {
    expect(uspStripSchema.safeParse({ enabled: false, items: [] }).success).toBe(true);
  });

  it('accepts a filled item', () => {
    expect(
      uspStripSchema.safeParse({
        enabled: true,
        items: [{ icon: 'leaf', title: 'Ground to order', description: 'Never from a warehouse.' }],
      }).success,
    ).toBe(true);
  });

  it('rejects items that are not a list', () => {
    expect(uspStripSchema.safeParse({ enabled: true, items: {} }).success).toBe(false);
  });
});

describe('home sections', () => {
  const section = (overrides: Record<string, unknown> = {}) => ({
    key: 'featured',
    enabled: true,
    heading: 'Picked for you',
    subheading: '',
    ...overrides,
  });

  it('accepts a section with a key and a heading', () => {
    expect(homeSectionsSchema.safeParse({ sections: [section()] }).success).toBe(true);
  });

  it('requires the key, which is what the storefront looks the section up by', () => {
    // Reordering must not change which heading lands on which section, so the
    // key is the identity - a section without one cannot be matched at all.
    expect(homeSectionsSchema.safeParse({ sections: [section({ key: undefined })] }).success).toBe(
      false,
    );
  });

  it('allows a section to be turned off without clearing its copy', () => {
    expect(
      homeSectionsSchema.safeParse({ sections: [section({ enabled: false })] }).success,
    ).toBe(true);
  });
});

describe('footer', () => {
  it('accepts nested columns and links', () => {
    expect(
      footerSchema.safeParse({
        columns: [
          {
            heading: 'Shop',
            links: [
              { label: 'All spices', href: '/shop' },
              { label: 'Recipes', href: '/recipes' },
            ],
          },
        ],
        note: 'Made in small batches.',
      }).success,
    ).toBe(true);
  });

  it('accepts a column with no links yet', () => {
    // Field arrays start empty; a half-built column must be savable.
    expect(
      footerSchema.safeParse({ columns: [{ heading: 'Shop', links: [] }], note: '' }).success,
    ).toBe(true);
  });

  it('accepts no columns at all', () => {
    expect(footerSchema.safeParse({ columns: [], note: '' }).success).toBe(true);
  });

  it('rejects a links value that is not a list', () => {
    expect(
      footerSchema.safeParse({ columns: [{ heading: 'Shop', links: 'nope' }], note: '' }).success,
    ).toBe(false);
  });
});
