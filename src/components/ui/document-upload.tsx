'use client';

import { useRef, useState } from 'react';
import { Download, FileText, Loader2, Paperclip, X } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { cn } from '@/lib/utils';
import { formatFileSize, useUploadFile } from '@/hooks/use-uploads';
import { getErrorMessage } from '@/lib/utils';
import { Button } from './button';

interface DocumentUploadProps {
  /** MediaAsset id, or empty. Controlled. */
  value?: string;
  onChange: (mediaAssetId: string) => void;
  /** Shown when a value exists but the filename isn't known (e.g. after a reload). */
  fallbackLabel?: string;
  className?: string;
}

/**
 * Upload for a PRIVATE document - bill and payment-receipt scans.
 *
 * Different from FileUpload in two ways that matter:
 *  - it stores the MediaAsset **id**, not a URL, because private assets have no
 *    public URL by design (they live outside the statically-served subtree)
 *  - viewing therefore goes through the authenticated documents route, fetched
 *    with the api client and handed to the browser as a blob. A plain <a href>
 *    cannot carry the bearer token.
 */
export function DocumentUpload({
  value,
  onChange,
  fallbackLabel = 'Attached document',
  className,
}: DocumentUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string>('');
  const [sizeBytes, setSizeBytes] = useState<number | null>(null);
  const [downloading, setDownloading] = useState(false);
  const upload = useUploadFile();

  const handleFile = (file?: File | null) => {
    if (!file) return;
    upload.mutate(
      { file, folder: 'bills' },
      {
        onSuccess: (asset) => {
          onChange(asset.id);
          setFileName(asset.fileName);
          setSizeBytes(asset.sizeBytes ?? null);
          if (inputRef.current) inputRef.current.value = '';
        },
      },
    );
  };

  const download = async () => {
    if (!value) return;
    setDownloading(true);
    try {
      const response = await api.get(`/admin/documents/${value}`, { responseType: 'blob' });
      const url = URL.createObjectURL(response.data as Blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName || 'document';
      anchor.click();
      // Revoked immediately after the click: the browser has already taken a
      // reference, and leaving it would leak the blob for the page's lifetime.
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setDownloading(false);
    }
  };

  if (value) {
    return (
      <div className={cn('flex items-center gap-2 rounded-md border border-ink-200 bg-paper-50 p-2.5', className)}>
        <FileText className="h-4 w-4 shrink-0 text-ink-400" />
        <span className="min-w-0 flex-1 truncate text-sm text-ink-700">
          {fileName || fallbackLabel}
          {sizeBytes ? (
            <span className="ml-2 font-data text-xs text-ink-400">{formatFileSize(sizeBytes)}</span>
          ) : null}
        </span>
        <Button type="button" variant="ghost" size="sm" onClick={download} loading={downloading} className="h-7 gap-1.5 px-2 text-xs">
          <Download className="h-3 w-3" /> Open
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => {
            onChange('');
            setFileName('');
            setSizeBytes(null);
          }}
          aria-label="Remove attachment"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="gap-1.5"
        loading={upload.isPending}
        onClick={() => inputRef.current?.click()}
      >
        {upload.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Paperclip className="h-3.5 w-3.5" />}
        Attach scan
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <p className="mt-1.5 text-xs text-ink-400">
        PDF or image. Stored privately — only readable by an admin, never by URL.
      </p>
    </div>
  );
}
