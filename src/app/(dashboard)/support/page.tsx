'use client';

import * as React from 'react';
import Link from 'next/link';
import { LifeBuoy, Search } from 'lucide-react';
import { useTickets } from '@/hooks/use-support';
import { PageHeader } from '@/components/ui/page-header';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import type { TicketStatus } from '@/types/api';

function ticketBadgeVariant(status: TicketStatus): 'paprika' | 'gold' | 'moss' | 'neutral' {
  switch (status) {
    case 'OPEN':
      return 'paprika';
    case 'IN_PROGRESS':
      return 'gold';
    case 'RESOLVED':
      return 'moss';
    case 'CLOSED':
      return 'neutral';
  }
}

export default function SupportTicketsPage() {
  const [page, setPage] = React.useState(1);
  const [search, setSearch] = React.useState('');
  const [status, setStatus] = React.useState<TicketStatus | ''>('');

  const { data, isLoading } = useTickets({ page, limit: 20, search: search || undefined, status: status || undefined });

  return (
    <div>
      <PageHeader title="Support Tickets" description="Customer inquiries and order support requests" />

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400" />
          <Input
            placeholder="Search ticket #, subject, email..."
            className="pl-9"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : (v as TicketStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        {isLoading || !data ? (
          <PageSpinner />
        ) : data.items.length === 0 ? (
          <EmptyState icon={LifeBuoy} title="No tickets found" />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>From</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((ticket) => (
                  <TableRow key={ticket.id}>
                    <TableCell>
                      <Link href={`/support/${ticket.id}`} className="font-data text-xs hover:text-gold-700">
                        {ticket.ticketNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="font-medium">{ticket.subject}</TableCell>
                    <TableCell className="text-sm">
                      <p className="text-ink-800">{ticket.name}</p>
                      <p className="text-xs text-ink-500">{ticket.email}</p>
                    </TableCell>
                    <TableCell className="text-sm text-ink-600">{formatDate(ticket.createdAt, true)}</TableCell>
                    <TableCell>
                      <Badge variant={ticketBadgeVariant(ticket.status)}>{ticket.status.replace('_', ' ')}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </>
        )}
      </Card>
    </div>
  );
}
