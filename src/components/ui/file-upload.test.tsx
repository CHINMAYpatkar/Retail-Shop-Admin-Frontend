// @vitest-environment jsdom
/**
 * The upload-or-paste field.
 *
 * These are presence-and-behaviour tests, written because of a specific past
 * failure: a product-restore checkbox was added to a form, `tsc`, `eslint` and
 * `next build` all passed, and the control was never rendered at all because
 * the edit landed at the wrong indentation. It shipped, and the user found it
 * by clicking. Compiling is not evidence that a control exists, so the controls
 * a user needs are asserted to be in the document.
 */
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mutate = vi.fn();
const uploadState = { mutate, isPending: false, data: undefined as { sizeBytes?: number } | undefined };

vi.mock('@/hooks/use-uploads', () => ({
  useUploadFile: () => uploadState,
  formatFileSize: (n: number) => `${n} B`,
}));

import { FileUpload } from './file-upload';

beforeEach(() => {
  mutate.mockReset();
  uploadState.isPending = false;
  uploadState.data = undefined;
});

describe('empty state', () => {
  it('offers a browse affordance', () => {
    render(<FileUpload value="" folder="products" onChange={vi.fn()} />);
    expect(screen.getByText(/browse/i)).toBeInTheDocument();
  });

  it('offers the external-URL path, which is a first-class case not a fallback', () => {
    render(<FileUpload value="" folder="products" onChange={vi.fn()} />);
    expect(screen.getByRole('button', { name: /use an external url/i })).toBeInTheDocument();
  });

  it('renders a file input restricted to the accepted types', () => {
    const { container } = render(<FileUpload value="" folder="products" onChange={vi.fn()} />);
    const input = container.querySelector('input[type="file"]');

    expect(input).not.toBeNull();
    // The accept attribute is a usability hint only - the backend decides the
    // real answer from the file bytes - but it must still be present and match.
    expect(input?.getAttribute('accept')).toContain('image/jpeg');
  });

  it('shows a spinner while an upload is in flight', () => {
    uploadState.isPending = true;
    render(<FileUpload value="" folder="products" onChange={vi.fn()} />);
    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
  });
});

describe('filled state', () => {
  it('previews an image and offers a remove control', () => {
    render(<FileUpload value="https://example.test/a.jpg" folder="products" onChange={vi.fn()} />);

    expect(screen.getByRole('button', { name: /remove/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /edit url/i })).toBeInTheDocument();
  });

  it('clears the value when removed', async () => {
    const onChange = vi.fn();
    render(<FileUpload value="https://example.test/a.jpg" folder="products" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /remove/i }));
    expect(onChange).toHaveBeenCalledWith('');
  });

  it('renders a video preview rather than an img for the video variant', () => {
    const { container } = render(
      <FileUpload value="https://example.test/a.mp4" folder="banners" variant="video" onChange={vi.fn()} />,
    );
    expect(container.querySelector('video')).not.toBeNull();
    expect(container.querySelector('img')).toBeNull();
  });
});

describe('uploading', () => {
  it('sends the chosen file to the configured folder', async () => {
    render(<FileUpload value="" folder="banners" onChange={vi.fn()} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['bytes'], 'masala.png', { type: 'image/png' });
    await userEvent.upload(input, file);

    expect(mutate).toHaveBeenCalledTimes(1);
    expect(mutate.mock.calls[0][0]).toMatchObject({ folder: 'banners' });
    expect(mutate.mock.calls[0][0].file.name).toBe('masala.png');
  });
});

describe('external URL entry', () => {
  it('commits a pasted URL, trimmed', async () => {
    const onChange = vi.fn();
    render(<FileUpload value="" folder="products" onChange={onChange} />);

    await userEvent.click(screen.getByRole('button', { name: /use an external url/i }));
    const input = screen.getByRole('textbox');
    await userEvent.type(input, '  https://cdn.example.test/x.jpg  ');
    await userEvent.tab();

    expect(onChange).toHaveBeenCalledWith('https://cdn.example.test/x.jpg');
  });
});
