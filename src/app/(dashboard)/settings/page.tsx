'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Share2, Search, Receipt } from 'lucide-react';
import {
  businessInfoSchema,
  socialLinksSchema,
  seoDefaultsSchema,
  invoiceSettingsSchema,
  type BusinessInfoFormValues,
  type SocialLinksFormValues,
  type SeoDefaultsFormValues,
  type InvoiceSettingsFormValues,
} from '@/lib/validations/settings.schema';
import { useAllSettings, useUpsertSetting } from '@/hooks/use-settings';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { FormField } from '@/components/ui/form-field';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PageSpinner } from '@/components/ui/spinner';

const BUSINESS_INFO_DEFAULTS: BusinessInfoFormValues = {
  businessName: '',
  supportEmail: '',
  supportPhone: '',
  addressLine: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'India',
};

const SOCIAL_LINKS_DEFAULTS: SocialLinksFormValues = { instagram: '', facebook: '', twitter: '', youtube: '' };

const SEO_DEFAULTS_DEFAULTS: SeoDefaultsFormValues = {
  defaultMetaTitle: '',
  defaultMetaDescription: '',
  ogImageUrl: '',
};

const INVOICE_SETTINGS_DEFAULTS: InvoiceSettingsFormValues = { invoicePrefix: 'RS', gstNumber: '', footerNote: '' };

function BusinessInfoSection({ initial }: { initial: BusinessInfoFormValues }) {
  const upsert = useUpsertSetting<BusinessInfoFormValues>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BusinessInfoFormValues>({ resolver: zodResolver(businessInfoSchema), values: initial });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building2 className="h-4 w-4" /> Business information
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'business_info', value: values }))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField label="Business name" htmlFor="businessName" error={errors.businessName?.message} required>
            <Input id="businessName" invalid={!!errors.businessName} {...register('businessName')} />
          </FormField>
          <FormField label="Support email" htmlFor="supportEmail" error={errors.supportEmail?.message} required>
            <Input id="supportEmail" type="email" invalid={!!errors.supportEmail} {...register('supportEmail')} />
          </FormField>
          <FormField label="Support phone" htmlFor="supportPhone" error={errors.supportPhone?.message} required>
            <Input id="supportPhone" invalid={!!errors.supportPhone} {...register('supportPhone')} />
          </FormField>
          <FormField label="Address line" htmlFor="addressLine" error={errors.addressLine?.message} required>
            <Input id="addressLine" invalid={!!errors.addressLine} {...register('addressLine')} />
          </FormField>
          <FormField label="City" htmlFor="city" error={errors.city?.message} required>
            <Input id="city" invalid={!!errors.city} {...register('city')} />
          </FormField>
          <FormField label="State" htmlFor="state" error={errors.state?.message} required>
            <Input id="state" invalid={!!errors.state} {...register('state')} />
          </FormField>
          <FormField label="Postal code" htmlFor="postalCode" error={errors.postalCode?.message} required>
            <Input id="postalCode" invalid={!!errors.postalCode} {...register('postalCode')} />
          </FormField>
          <FormField label="Country" htmlFor="country" error={errors.country?.message} required>
            <Input id="country" invalid={!!errors.country} {...register('country')} />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" variant="gold" loading={upsert.isPending}>
              Save business info
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SocialLinksSection({ initial }: { initial: SocialLinksFormValues }) {
  const upsert = useUpsertSetting<SocialLinksFormValues>();
  const { register, handleSubmit } = useForm<SocialLinksFormValues>({
    resolver: zodResolver(socialLinksSchema),
    values: initial,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-4 w-4" /> Social links
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'social_links', value: values }))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField label="Instagram" htmlFor="instagram">
            <Input id="instagram" placeholder="https://instagram.com/..." {...register('instagram')} />
          </FormField>
          <FormField label="Facebook" htmlFor="facebook">
            <Input id="facebook" placeholder="https://facebook.com/..." {...register('facebook')} />
          </FormField>
          <FormField label="Twitter / X" htmlFor="twitter">
            <Input id="twitter" placeholder="https://x.com/..." {...register('twitter')} />
          </FormField>
          <FormField label="YouTube" htmlFor="youtube">
            <Input id="youtube" placeholder="https://youtube.com/..." {...register('youtube')} />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" variant="gold" loading={upsert.isPending}>
              Save social links
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function SeoDefaultsSection({ initial }: { initial: SeoDefaultsFormValues }) {
  const upsert = useUpsertSetting<SeoDefaultsFormValues>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SeoDefaultsFormValues>({ resolver: zodResolver(seoDefaultsSchema), values: initial });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-4 w-4" /> SEO defaults
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'seo_defaults', value: values }))}
          className="space-y-4"
        >
          <FormField label="Default meta title" htmlFor="defaultMetaTitle" error={errors.defaultMetaTitle?.message} required>
            <Input id="defaultMetaTitle" invalid={!!errors.defaultMetaTitle} {...register('defaultMetaTitle')} />
          </FormField>
          <FormField
            label="Default meta description"
            htmlFor="defaultMetaDescription"
            error={errors.defaultMetaDescription?.message}
            required
          >
            <Textarea id="defaultMetaDescription" rows={2} invalid={!!errors.defaultMetaDescription} {...register('defaultMetaDescription')} />
          </FormField>
          <FormField label="Default OG image URL" htmlFor="ogImageUrl">
            <Input id="ogImageUrl" placeholder="https://..." {...register('ogImageUrl')} />
          </FormField>
          <Button type="submit" variant="gold" loading={upsert.isPending}>
            Save SEO defaults
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InvoiceSettingsSection({ initial }: { initial: InvoiceSettingsFormValues }) {
  const upsert = useUpsertSetting<InvoiceSettingsFormValues>();
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InvoiceSettingsFormValues>({ resolver: zodResolver(invoiceSettingsSchema), values: initial });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="h-4 w-4" /> Invoice settings
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form
          onSubmit={handleSubmit((values) => upsert.mutate({ key: 'invoice_settings', value: values }))}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          <FormField label="Invoice number prefix" htmlFor="invoicePrefix" error={errors.invoicePrefix?.message} required>
            <Input id="invoicePrefix" invalid={!!errors.invoicePrefix} {...register('invoicePrefix')} />
          </FormField>
          <FormField label="GST / tax number" htmlFor="gstNumber">
            <Input id="gstNumber" {...register('gstNumber')} />
          </FormField>
          <FormField label="Invoice footer note" htmlFor="footerNote" className="sm:col-span-2">
            <Textarea id="footerNote" rows={2} {...register('footerNote')} />
          </FormField>
          <div className="sm:col-span-2">
            <Button type="submit" variant="gold" loading={upsert.isPending}>
              Save invoice settings
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SettingsPage() {
  const { data: settings, isLoading } = useAllSettings();

  if (isLoading || !settings) return <PageSpinner />;

  const businessInfo = { ...BUSINESS_INFO_DEFAULTS, ...(settings.business_info as Partial<BusinessInfoFormValues>) };
  const socialLinks = { ...SOCIAL_LINKS_DEFAULTS, ...(settings.social_links as Partial<SocialLinksFormValues>) };
  const seoDefaults = { ...SEO_DEFAULTS_DEFAULTS, ...(settings.seo_defaults as Partial<SeoDefaultsFormValues>) };
  const invoiceSettings = {
    ...INVOICE_SETTINGS_DEFAULTS,
    ...(settings.invoice_settings as Partial<InvoiceSettingsFormValues>),
  };

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Business information, social links, SEO defaults, and invoicing"
      />
      <p className="mb-4 -mt-2 text-xs text-ink-500">
        Note: SMTP is configured via the backend&apos;s environment variables, not here — there&apos;s no live email
        provider wired up yet.
      </p>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <BusinessInfoSection initial={businessInfo} />
        <SocialLinksSection initial={socialLinks} />
        <SeoDefaultsSection initial={seoDefaults} />
        <InvoiceSettingsSection initial={invoiceSettings} />
      </div>
    </div>
  );
}
