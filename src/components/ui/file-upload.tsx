'use client';

import { useRef, useState } from 'react';
import { ImageIcon, Link2, Loader2, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatFileSize, useUploadFile } from '@/hooks/use-uploads';
import type { UploadFolder } from '@/types/api';
import { Button } from './button';
import { Input } from './input';

interface FileUploadProps {
  /** Current URL, or empty. This component is controlled. */
  value?: string;
  onChange: (url: string) => void;
  folder: UploadFolder;
  accept?: string;
  /** Videos need a taller preview and a different empty-state hint. */
  variant?: 'image' | 'video' | 'document';
  placeholder?: string;
  className?: string;
}

/**
 * Upload-or-paste field for a single asset.
 *
 * Both paths are kept deliberately. Uploading covers the normal case, and
 * pasting a URL still matters for assets hosted elsewhere - which the backend
 * supports as a first-class case, not a fallback.
 */
export function FileUpload({
  value,
  onChange,
  folder,
  accept = 'image/jpeg,image/png,image/webp,image/avif',
  variant = 'image',
  placeholder = 'https://...',
  className,
}: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [dragging, setDragging] = useState(false);
  const upload = useUploadFile();

  const handleFile = (file?: File | null) => {
    if (!file) return;
    upload.mutate(
      { file, folder },
      {
        onSuccess: (asset) => {
          if (asset.url) onChange(asset.url);
          if (inputRef.current) inputRef.current.value = '';
        },
      },
    );
  };

  return (
    <div className={cn('space-y-2', className)}>
      {value ? (
        <div className="group relative overflow-hidden rounded-md border border-ink-200 bg-paper-50">
          {variant === 'video' ? (
            <video src={value} className="h-40 w-full bg-ink-900 object-contain" controls />
          ) : (
            // Not next/image: these URLs are user-supplied and may point at any
            // host, which would need every one added to next.config remotePatterns.
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" className="h-40 w-full object-contain" />
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-full bg-ink-900/80 p-1.5 text-paper-50 opacity-0 transition-opacity group-hover:opacity-100"
            aria-label="Remove"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            handleFile(e.dataTransfer.files?.[0]);
          }}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex h-28 cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed transition-colors',
            dragging ? 'border-gold-500 bg-gold-50' : 'border-ink-200 hover:border-ink-300',
          )}
        >
          {upload.isPending ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin text-gold-600" />
              <span className="text-xs text-ink-500">Uploading…</span>
            </>
          ) : (
            <>
              {variant === 'image' ? (
                <ImageIcon className="h-5 w-5 text-ink-400" />
              ) : (
                <Upload className="h-5 w-5 text-ink-400" />
              )}
              <span className="text-xs text-ink-500">
                Drop a file here, or <span className="text-gold-700 underline">browse</span>
              </span>
            </>
          )}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />

      {showUrlInput ? (
        <Input
          autoFocus
          placeholder={placeholder}
          defaultValue={value}
          onBlur={(e) => {
            onChange(e.target.value.trim());
            setShowUrlInput(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onChange((e.target as HTMLInputElement).value.trim());
              setShowUrlInput(false);
            }
          }}
        />
      ) : (
        <div className="flex items-center justify-between">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowUrlInput(true)}
            className="h-7 gap-1.5 px-2 text-xs"
          >
            <Link2 className="h-3 w-3" />
            {value ? 'Edit URL' : 'Use an external URL'}
          </Button>
          {upload.data?.sizeBytes ? (
            <span className="font-data text-[11px] text-ink-400">
              {formatFileSize(upload.data.sizeBytes)}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
