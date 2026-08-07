'use client';

import * as React from 'react';
import Link from 'next/link';
import { Users } from 'lucide-react';
import { useCustomers } from '@/hooks/use-customers';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function CustomersPage() {
  const { data: customers, isLoading } = useCustomers({ page: 1, limit: 50 });

  return (
    <div>
      <PageHeader title="Customers" description="View and manage customer accounts" />

      <Card>
        {isLoading || !customers ? (
          <PageSpinner />
        ) : customers.length === 0 ? (
          <EmptyState icon={Users} title="No customers yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Orders</TableHead>
                <TableHead className="text-right">Wishlist</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.id}>
                  <TableCell>
                    <Link href={`/customers/${customer.id}`} className="font-medium hover:text-gold-700">
                      {customer.name || 'Unnamed'}
                    </Link>
                    <p className="text-xs text-ink-500">{customer.email}</p>
                  </TableCell>
                  <TableCell className="text-sm text-ink-600">{formatDate(customer.createdAt)}</TableCell>
                  <TableCell className="text-right font-data">{customer._count?.orders ?? 0}</TableCell>
                  <TableCell className="text-right font-data">{customer._count?.wishlist ?? 0}</TableCell>
                  <TableCell>
                    <Badge variant={customer.isActive ? 'moss' : 'paprika'}>
                      {customer.isActive ? 'Active' : 'Deactivated'}
                    </Badge>
                    {!customer.emailVerifiedAt && (
                      <Badge variant="neutral" className="ml-1">
                        Unverified
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
