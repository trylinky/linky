'use client';

import { AssetContexts, assetOutputSizes } from '@/lib/asset';
import { downscaleImage } from '@/lib/downscale-image';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { captureException } from '@sentry/nextjs';
import { Button, cn, toast } from '@trylinky/ui';
import { ChangeEvent, useEffect, useState } from 'react';

interface Props {
  onUploaded: (url: string) => void;
  initialValue?: string;
  referenceId: string;
  label?: string;
  isCondensed?: boolean;
  assetContext: AssetContexts;
  htmlFor: string;
}

export function FormFileUpload({
  onUploaded,
  initialValue,
  referenceId,
  label = 'Asset',
  assetContext,
  isCondensed = false,
  htmlFor,
}: Props) {
  const [uploadedFileUrl, setUploadedFileUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (initialValue) {
      setUploadedFileUrl(initialValue);
    }
  }, [initialValue]);

  const handleUpload = async (ev: ChangeEvent<HTMLInputElement>) => {
    ev.preventDefault();

    const input = ev.target;
    const selectedFile = input?.files?.[0];

    // Clear the input so choosing the same file again (e.g. after a failed
    // upload) still fires onChange.
    if (input) {
      input.value = '';
    }

    if (!selectedFile || !referenceId) {
      return;
    }

    if (!selectedFile.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    setIsUploading(true);

    try {
      const url = await uploadFile(selectedFile);

      if (url) {
        onUploaded(url);
        setUploadedFileUrl(url);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const uploadFile = async (selectedFile: File) => {
    const firstFile = await downscaleImage(
      selectedFile,
      assetOutputSizes[assetContext]
    );

    if (firstFile.size > 10 * 1024 * 1024) {
      alert('File too large. Please upload a file smaller than 10MB.');
      return null;
    }

    const body = new FormData();

    // This order is important for the API to correctly parse the multipart form
    // data - text fields must be appended before file uploads
    body.append('referenceId', referenceId);
    body.append('assetContext', assetContext);
    body.append('file', firstFile, firstFile.name);

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/assets/upload`,
        {
          method: 'POST',
          credentials: 'include',
          body,
        }
      );

      // Error responses are not always JSON (a 401 is plain text, and a
      // Worker that crashed returns Cloudflare's HTML error page).
      const responseData = await response.json().catch(() => null);

      if (!response.ok || !responseData?.url) {
        throw new Error(
          responseData?.error?.message ??
            `Upload failed with status ${response.status}`
        );
      }

      return responseData.url as string;
    } catch (error) {
      captureException(error);
      toast({
        title: 'Upload failed',
        description:
          'We could not upload that image. Please try again, or try a smaller image.',
        variant: 'error',
      });
      return null;
    }
  };

  const onRemoveFile = () => {
    setUploadedFileUrl(null);
    onUploaded('');
  };

  return (
    <>
      <span className="block text-sm font-medium leading-6 text-gray-900">
        {label}
      </span>
      {uploadedFileUrl && (
        <div className="flex items-center gap-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={uploadedFileUrl} className="w-16 h-16 rounded-md" alt="" />

          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onRemoveFile}
          >
            Remove
          </Button>
        </div>
      )}

      <div
        className={cn(
          'mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/250',
          isCondensed ? ' px-4 py-5' : ' px-6 py-10'
        )}
      >
        <div className="text-center flex items-center flex-col">
          <PhotoIcon
            className="mx-auto h-12 w-12 text-gray-300"
            aria-hidden="true"
          />
          <div className="mt-4 flex text-sm text-center leading-6 text-gray-600">
            <label
              htmlFor={htmlFor}
              className="relative text-center cursor-pointer rounded-md bg-white font-semibold text-indigo-600 focus-within:outline-none focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2 hover:text-indigo-500"
            >
              <span>{isUploading ? 'Uploading…' : 'Select a file'}</span>
              <input
                id={htmlFor}
                name={htmlFor}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                onChange={handleUpload}
                disabled={isUploading}
              />
            </label>
          </div>
          <p className="text-xs leading-5 text-gray-600">PNG, JPG up to 10MB</p>
        </div>
      </div>
    </>
  );
}
