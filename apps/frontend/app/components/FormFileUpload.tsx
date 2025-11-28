'use client';

import { AssetContexts } from '@/lib/asset';
import { PhotoIcon } from '@heroicons/react/24/solid';
import { Button, cn } from '@trylinky/ui';
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

  useEffect(() => {
    if (initialValue) {
      setUploadedFileUrl(initialValue);
    }
  }, [initialValue]);

  const handleUpload = async (ev: ChangeEvent<HTMLInputElement>) => {
    ev.preventDefault();

    const firstFile = ev.target?.files?.[0];

    if (!firstFile || !referenceId) {
      return;
    }

    if (firstFile.size > 10 * 1024 * 1024) {
      alert('File too large. Please upload a file smaller than 10MB.');
      return;
    }

    if (!firstFile.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    const body = new FormData();

    // This order is important for the API to correctly parse the multipart form
    // data - text fields must be appended before file uploads
    body.append('referenceId', referenceId);
    body.append('assetContext', assetContext);
    body.append('file', firstFile, firstFile.name);

    const response = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/assets/upload`,
      {
        method: 'POST',
        credentials: 'include',
        body,
      }
    );

    const responseData = await response.json();

    if (!response.ok) {
      console.error(responseData.message);
      return;
    }

    onUploaded(responseData.url);
    setUploadedFileUrl(responseData.url);
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
              <span>Select a file</span>
              <input
                id={htmlFor}
                name={htmlFor}
                type="file"
                className="sr-only"
                onChange={handleUpload}
              />
            </label>
          </div>
          <p className="text-xs leading-5 text-gray-600">PNG, JPG up to 10MB</p>
        </div>
      </div>
    </>
  );
}
