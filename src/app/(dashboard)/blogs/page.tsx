'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Newspaper } from 'lucide-react';
import { useBlogs, useDeleteBlog } from '@/hooks/use-blogs';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { PageSpinner } from '@/components/ui/spinner';
import { ConfirmDialog } from '@/components/ui/alert-dialog';
import { formatDate } from '@/lib/utils';
import type { Blog } from '@/types/api';

export default function BlogsPage() {
  const router = useRouter();
  const { data: blogs, isLoading } = useBlogs();
  const deleteBlog = useDeleteBlog();
  const [deleteTarget, setDeleteTarget] = React.useState<Blog | undefined>();

  return (
    <div>
      <PageHeader
        title="Blogs"
        description="Recipe stories and spice education content"
        actions={
          <Button variant="gold" onClick={() => router.push('/blogs/new')}>
            <Plus className="h-4 w-4" /> New post
          </Button>
        }
      />

      <Card>
        {isLoading ? (
          <PageSpinner />
        ) : !blogs || blogs.length === 0 ? (
          <EmptyState icon={Newspaper} title="No blog posts yet" />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Published</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blogs.map((blog) => (
                <TableRow key={blog.id}>
                  <TableCell>
                    <Link href={`/blogs/${blog.id}`} className="font-medium hover:text-gold-700">
                      {blog.title}
                    </Link>
                    <p className="text-xs text-ink-500">/{blog.slug}</p>
                  </TableCell>
                  <TableCell className="text-sm text-ink-600">
                    {blog.publishedAt ? formatDate(blog.publishedAt) : '—'}
                  </TableCell>
                  <TableCell>
                    <Badge variant={blog.isPublished ? 'moss' : 'neutral'}>
                      {blog.isPublished ? 'Published' : 'Draft'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => router.push(`/blogs/${blog.id}`)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteTarget(blog)}>
                        <Trash2 className="h-4 w-4 text-paprika-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(undefined)}
        title="Delete blog post?"
        description={`"${deleteTarget?.title}" will be permanently removed.`}
        confirmLabel="Delete"
        destructive
        loading={deleteBlog.isPending}
        onConfirm={() => {
          if (deleteTarget) deleteBlog.mutate(deleteTarget.id, { onSuccess: () => setDeleteTarget(undefined) });
        }}
      />
    </div>
  );
}
