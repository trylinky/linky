'use client';

import { notFound, useParams } from 'next/navigation';

const integrations: Record<string, string> = {
  spotify: 'Spotify',
  instagram: 'Instagram',
  threads: 'Threads',
  tiktok: 'TikTok',
};

export default function IntegrationSuccessPage() {
  const params = useParams();

  const { integrationId } = params;

  const integrationName = integrations[integrationId as string];

  if (!integrationName) {
    notFound();
  }

  return (
    <div className="bg-white sm:rounded-lg fixed top-0 left-0 z-50 w-full h-screen flex items-center justify-center">
      <div className="bg-stone-50 rounded-lg w-full max-w-lg">
        <div className="px-8 py-16 text-center">
          <h3 className="text-base font-semibold leading-6 text-gray-900">
            Success. Your {integrationName} account is now connected!
          </h3>
          <div className="mt-2 max-w-xl text-sm text-gray-500">
            <p>You can now safely close this tab and return to your page.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
