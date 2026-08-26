'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { api, unwrap } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { getErrorMessage } from '@/lib/utils';
import type { VendorFormValues } from '@/lib/validations/vendor.schema';
import type { PaginatedResponse, Vendor } from '@/types/api';

export interface VendorsQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export function useVendors(params: VendorsQueryParams) {
  return useQuery({
    queryKey: queryKeys.vendors(params),
    queryFn: async () =>
      unwrap<PaginatedResponse<Vendor>>(await api.get('/admin/vendors', { params })),
    placeholderData: (prev) => prev,
  });
}

/** Blank optional fields are sent as undefined so they clear rather than storing ''. */
function toPayload(values: VendorFormValues) {
  const blankToUndefined = (v?: string) => (v && v.trim() ? v.trim() : undefined);
  return {
    name: values.name.trim(),
    contactPerson: blankToUndefined(values.contactPerson),
    email: blankToUndefined(values.email),
    phone: blankToUndefined(values.phone),
    addressLine1: blankToUndefined(values.addressLine1),
    addressLine2: blankToUndefined(values.addressLine2),
    city: blankToUndefined(values.city),
    state: blankToUndefined(values.state),
    postalCode: blankToUndefined(values.postalCode),
    gstin: blankToUndefined(values.gstin),
    notes: blankToUndefined(values.notes),
    isActive: values.isActive,
  };
}

export function useCreateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (values: VendorFormValues) =>
      unwrap<Vendor>(await api.post('/admin/vendors', toPayload(values))),
    onSuccess: () => {
      toast.success('Vendor created');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useUpdateVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id: string; values: VendorFormValues }) =>
      unwrap<Vendor>(await api.patch(`/admin/vendors/${id}`, toPayload(values))),
    onSuccess: () => {
      toast.success('Vendor updated');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}

export function useDeleteVendor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => api.delete(`/admin/vendors/${id}`),
    onSuccess: () => {
      toast.success('Vendor deleted');
      queryClient.invalidateQueries({ queryKey: ['vendors'] });
    },
    // The API refuses to delete a vendor with bills or payments and explains
    // why; surface that message rather than a generic failure.
    onError: (error) => toast.error(getErrorMessage(error)),
  });
}
