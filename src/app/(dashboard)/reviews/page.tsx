'use client';

import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Star, MessageSquare, Check, X, Trash2 } from 'lucide-react';
import { useReviews, useUpdateReviewStatus, useReplyToReview, useDeleteReview } from '@/hooks/use-reviews';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Pagination } from '@/components/ui/pagination';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { ReviewStatusBadge } from '@/components/ui/status-badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';
import type { Review, ReviewStatus } from '@/types/api';

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? 'fill-gold-500 text-gold-500' : 'text-paper-200'}`} />
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  const [replyOpen, setReplyOpen] = React.useState(false);
  const [reply, setReply] = React.useState(review.adminReply || '');
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const updateStatus = useUpdateReviewStatus();
  const replyToReview = useReplyToReview();
  const deleteReview = useDeleteReview();

  return (
    <Card>
      <CardContent className="space-y-3 py-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Stars rating={review.rating} />
              <ReviewStatusBadge status={review.status} />
              {review.isVerifiedPurchase && <Badge variant="clove">Verified purchase</Badge>}
            </div>
            {review.title && <p className="mt-1 font-medium text-ink-900">{review.title}</p>}
            <p className="text-xs text-ink-500">
              {review.customer.name || review.customer.email} · on {review.product.name} · {formatDate(review.createdAt)}
            </p>
          </div>
          <div className="flex gap-1">
            {review.status !== 'APPROVED' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateStatus.mutate({ id: review.id, status: 'APPROVED' })}
              >
                <Check className="h-4 w-4 text-moss-600" />
              </Button>
            )}
            {review.status !== 'REJECTED' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => updateStatus.mutate({ id: review.id, status: 'REJECTED' })}
              >
                <X className="h-4 w-4 text-paprika-600" />
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setReplyOpen((v) => !v)}>
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
              <Trash2 className="h-4 w-4 text-paprika-600" />
            </Button>
          </div>
        </div>

        {review.comment && <p className="text-sm text-ink-700">{review.comment}</p>}

        {review.images.length > 0 && (
          <div className="flex gap-2">
            {review.images.map((img) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={img.id} src={img.url} alt="" className="h-16 w-16 rounded-md object-cover" />
            ))}
          </div>
        )}

        {review.adminReply && !replyOpen && (
          <div className="rounded-md bg-paper-100 px-3 py-2 text-sm text-ink-700">
            <span className="font-medium">Your reply: </span>
            {review.adminReply}
          </div>
        )}

        {replyOpen && (
          <div className="space-y-2">
            <Textarea rows={2} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply..." />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setReplyOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="gold"
                size="sm"
                loading={replyToReview.isPending}
                onClick={() => replyToReview.mutate({ id: review.id, reply }, { onSuccess: () => setReplyOpen(false) })}
              >
                Post reply
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete review?"
        description="This review will be permanently removed."
        confirmLabel="Delete"
        destructive
        loading={deleteReview.isPending}
        onConfirm={() => deleteReview.mutate(review.id, { onSuccess: () => setDeleteOpen(false) })}
      />
    </Card>
  );
}

export default function ReviewsPage() {
  const searchParams = useSearchParams();
  const initialStatus = (searchParams.get('status') as ReviewStatus | null) || '';
  const [page, setPage] = React.useState(1);
  const [status, setStatus] = React.useState<ReviewStatus | ''>(initialStatus);

  const { data, isLoading } = useReviews({ page, limit: 10, status: status || undefined });

  return (
    <div>
      <PageHeader title="Reviews" description="Moderate customer reviews" />

      <div className="mb-4">
        <Select
          value={status || 'all'}
          onValueChange={(v) => {
            setStatus(v === 'all' ? '' : (v as ReviewStatus));
            setPage(1);
          }}
        >
          <SelectTrigger className="w-52">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
            <SelectItem value="APPROVED">Approved</SelectItem>
            <SelectItem value="REJECTED">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading || !data ? (
        <PageSpinner />
      ) : data.items.length === 0 ? (
        <Card>
          <EmptyState icon={Star} title="No reviews found" />
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map((review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
          <Card className="mt-3">
            <Pagination page={data.page} totalPages={data.totalPages} onPageChange={setPage} />
          </Card>
        </>
      )}
    </div>
  );
}
