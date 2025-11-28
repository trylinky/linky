import { Card } from './card';
import { validateOrchestration } from '@/app/tiktok/actions';
import { MarketingContainer } from '@/components/marketing-container';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';

export default async function TiktokCallbackPage({
  params,
}: {
  params: Promise<{ orchestrationId: string }>;
}) {
  const { orchestrationId } = await params;

  const orchestrationIsValid = await validateOrchestration(orchestrationId);

  if (!orchestrationIsValid) {
    return redirect('/tiktok');
  }

  return (
    <div className="w-full h-full bg-stone-white py-32 min-h-[calc(100vh-160px)] relative flex items-center">
      <MarketingContainer className="relative z-10 w-full">
        <Suspense
          fallback={<Card isLoading orchestrationId={orchestrationId} />}
        >
          <Card orchestrationId={orchestrationId} />
        </Suspense>
      </MarketingContainer>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 aspect-square max-w-xl w-full transform-gpu bg-[linear-gradient(115deg,var(--tw-gradient-stops))] from-[#fff1be] from-[28%] via-[#ee87cb] via-[70%] to-[#b060ff] rotate-[-10deg] rounded-full blur-3xl animate-pulse"></div>
    </div>
  );
}
