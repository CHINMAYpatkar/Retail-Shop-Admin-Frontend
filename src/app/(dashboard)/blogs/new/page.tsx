'use client';

import { PageHeader } from '@/components/ui/page-header';
import { BlogForm } from '@/components/blogs/blog-form';

export default function NewBlogPage() {
  return (
    <div>
      <PageHeader title="New blog post" description="Share a recipe story or spice education article" />
      <BlogForm />
    </div>
  );
}
