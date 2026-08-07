'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Send } from 'lucide-react';
import { useTicket, useReplyToTicket, useUpdateTicketStatus } from '@/hooks/use-support';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn, formatDate } from '@/lib/utils';
import type { TicketStatus } from '@/types/api';

export default function TicketDetailPage() {
  const params = useParams<{ id: string }>();
  const { data: ticket, isLoading } = useTicket(params.id);
  const reply = useReplyToTicket();
  const updateStatus = useUpdateTicketStatus();
  const [message, setMessage] = React.useState('');

  if (isLoading) return <PageSpinner />;
  if (!ticket) return <EmptyState title="Ticket not found" />;

  return (
    <div>
      <PageHeader
        title={ticket.subject}
        description={`${ticket.ticketNumber} · from ${ticket.name} (${ticket.email})`}
        actions={
          <Select
            value={ticket.status}
            onValueChange={(v) => updateStatus.mutate({ id: ticket.id, status: v as TicketStatus })}
          >
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="OPEN">Open</SelectItem>
              <SelectItem value="IN_PROGRESS">In progress</SelectItem>
              <SelectItem value="RESOLVED">Resolved</SelectItem>
              <SelectItem value="CLOSED">Closed</SelectItem>
            </SelectContent>
          </Select>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Conversation</CardTitle>
          <Badge variant="neutral">
            {ticket.messages.length} message{ticket.messages.length === 1 ? '' : 's'}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {ticket.messages.map((msg) => {
            const isAdmin = msg.senderType === 'admin';
            return (
              <div key={msg.id} className={cn('flex', isAdmin ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-lg rounded-lg px-4 py-2.5 text-sm',
                    isAdmin ? 'bg-gold-600 text-white' : 'bg-paper-100 text-ink-800',
                  )}
                >
                  <p className="mb-1 text-xs font-medium opacity-80">
                    {isAdmin ? msg.senderName || 'Admin' : msg.senderName || ticket.name}
                  </p>
                  <p className="whitespace-pre-wrap">{msg.message}</p>
                  <p className={cn('mt-1 text-[11px]', isAdmin ? 'text-gold-100' : 'text-ink-400')}>
                    {formatDate(msg.createdAt, true)}
                  </p>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="space-y-3 py-4">
          <Textarea
            rows={3}
            placeholder="Write a reply to the customer..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          <div className="flex justify-end">
            <Button
              variant="gold"
              loading={reply.isPending}
              disabled={!message.trim()}
              onClick={() => reply.mutate({ id: ticket.id, message }, { onSuccess: () => setMessage('') })}
            >
              <Send className="h-4 w-4" /> Send reply
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
