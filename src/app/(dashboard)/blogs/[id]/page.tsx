'use client';

import { useParams } from 'next/navigation';
import { useBlog } from '@/hooks/use-blogs';
import { PageHeader } from '@/components/ui/page-header';
import { PageSpinner } from '@/components/ui/spinner';
import { EmptyState } from '@/components/ui/empty-state';
import { BlogForm } from '@/components/blogs/blog-form';

export default function EditBlogPage() {
  const params = useParams<{ id: string }>();
  const { data: blog, isLoading } = useBlog(params.id);

  if (isLoading) return <PageSpinner />;
  if (!blog) return <EmptyState title="Blog post not found" />;

  return (
    <div>
      <PageHeader title={blog.title} description="Edit blog post" />
      <BlogForm blog={blog} />
    </div>
  );
}
