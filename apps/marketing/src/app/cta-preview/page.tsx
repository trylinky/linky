import { PseoCtaCard } from '@/components/pseo/pseo-cta-card';

/**
 * Temporary comparison page — /i/cta-preview
 * Renders all three CTA card schemes side-by-side for design review.
 * Safe to delete once a scheme is chosen.
 */
export default function CtaPreviewPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 pt-12 pb-24 space-y-4">
      <p className="text-sm font-semibold uppercase tracking-wider text-gray-400">
        Option A — Indigo
      </p>
      <PseoCtaCard scheme="indigo" />

      <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 pt-8">
        Option B — Coral
      </p>
      <PseoCtaCard scheme="coral" />

      <p className="text-sm font-semibold uppercase tracking-wider text-gray-400 pt-8">
        Option C — Soft
      </p>
      <PseoCtaCard scheme="soft" />
    </div>
  );
}
