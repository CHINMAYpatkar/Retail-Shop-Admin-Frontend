import { z } from 'zod';

export const businessInfoSchema = z.object({
  businessName: z.string().min(1, 'Business name is required'),
  supportEmail: z.string().email('Enter a valid email address'),
  supportPhone: z.string().min(1, 'Phone number is required'),
  addressLine: z.string().min(1, 'Address is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().min(1, 'Country is required'),
});
export type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

export const socialLinksSchema = z.object({
  instagram: z.string().optional().or(z.literal('')),
  facebook: z.string().optional().or(z.literal('')),
  twitter: z.string().optional().or(z.literal('')),
  youtube: z.string().optional().or(z.literal('')),
});
export type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;

export const seoDefaultsSchema = z.object({
  defaultMetaTitle: z.string().min(1, 'Default meta title is required'),
  defaultMetaDescription: z.string().min(1, 'Default meta description is required'),
  ogImageUrl: z.string().optional().or(z.literal('')),
});
export type SeoDefaultsFormValues = z.infer<typeof seoDefaultsSchema>;

export const invoiceSettingsSchema = z.object({
  invoicePrefix: z.string().min(1, 'Invoice prefix is required'),
  gstNumber: z.string().optional().or(z.literal('')),
  footerNote: z.string().optional().or(z.literal('')),
});
export type InvoiceSettingsFormValues = z.infer<typeof invoiceSettingsSchema>;

// ---------------------------------------------------------------------------
// Storefront chrome (SF-30, SF-31)
//
// These five keys are everything the customer site renders that is not a
// product or a CMS page: the logo, the announcement bar, the "why buy from us"
// strip, the home section headings, and the footer. Without forms for them the
// only way to change the storefront was to edit JSON in the database.
// ---------------------------------------------------------------------------

export const brandingSchema = z.object({
  logoUrl: z.string().optional().or(z.literal('')),
  faviconUrl: z.string().optional().or(z.literal('')),
  // Shown when no logo is uploaded, so the shop still has an identity.
  wordmark: z.string().optional().or(z.literal('')),
});
export type BrandingFormValues = z.infer<typeof brandingSchema>;

export const announcementSchema = z
  .object({
    enabled: z.boolean(),
    message: z.string().optional().or(z.literal('')),
    linkLabel: z.string().optional().or(z.literal('')),
    linkUrl: z.string().optional().or(z.literal('')),
  })
  // The storefront renders the bar only when there is a message, and renders
  // the link only when it has both halves. Both are the right defensive calls
  // there, but they make a half-filled form save cleanly and then show
  // nothing - which reads as a broken save. Say it here instead.
  .refine((value) => !value.enabled || Boolean(value.message?.trim()), {
    message: 'Add a message, or turn the bar off',
    path: ['message'],
  })
  .refine(
    (value) => Boolean(value.linkLabel?.trim()) === Boolean(value.linkUrl?.trim()),
    {
      message: 'A link needs both a label and a URL',
      path: ['linkUrl'],
    },
  );
export type AnnouncementFormValues = z.infer<typeof announcementSchema>;

export const uspStripSchema = z.object({
  enabled: z.boolean(),
  items: z.array(
    z.object({
      // Matches the icon names the storefront maps; anything else falls back.
      icon: z.string().optional().or(z.literal('')),
      title: z.string().optional().or(z.literal('')),
      description: z.string().optional().or(z.literal('')),
    }),
  ),
});
export type UspStripFormValues = z.infer<typeof uspStripSchema>;

export const homeSectionsSchema = z.object({
  sections: z.array(
    z.object({
      // The storefront looks sections up by key, not by position, so this is
      // not editable - reordering must not change which heading goes where.
      key: z.string(),
      enabled: z.boolean(),
      heading: z.string().optional().or(z.literal('')),
      subheading: z.string().optional().or(z.literal('')),
    }),
  ),
});
export type HomeSectionsFormValues = z.infer<typeof homeSectionsSchema>;

export const footerSchema = z.object({
  columns: z.array(
    z.object({
      heading: z.string().optional().or(z.literal('')),
      links: z.array(
        z.object({
          label: z.string().optional().or(z.literal('')),
          href: z.string().optional().or(z.literal('')),
        }),
      ),
    }),
  ),
  note: z.string().optional().or(z.literal('')),
});
export type FooterFormValues = z.infer<typeof footerSchema>;
