'use client';

import { cn } from '@trylinky/ui';
import { useFormikContext } from 'formik';
import { Check, Loader2, X } from 'lucide-react';

export type SlugAvailability =
  | 'idle'
  | 'checking'
  | 'available'
  | 'taken'
  | 'error';

// Mirrors regexSlug (lowercase letters, numbers, underscores) so typing can
// never produce an invalid handle — spaces and dashes become underscores.
const sanitizeSlug = (value: string) =>
  value
    .toLowerCase()
    .replace(/[\s-]+/g, '_')
    .replace(/[^a-z0-9_]/g, '');

interface HandleStepProps {
  availability: SlugAvailability;
  error?: string;
}

export function HandleStep({ availability, error }: HandleStepProps) {
  const { values, setFieldValue } = useFormikContext<{ pageSlug: string }>();
  const slug = values.pageSlug;

  const showError = !!error && availability !== 'available';

  return (
    <div>
      <label
        htmlFor="pageSlug"
        className={cn(
          'flex items-center rounded-xl bg-white shadow-xs ring-1 dark:bg-slate-950',
          availability === 'taken' || showError
            ? 'ring-red-300 focus-within:ring-2 focus-within:ring-red-500 dark:ring-red-900'
            : availability === 'available'
              ? 'ring-emerald-400 focus-within:ring-2 focus-within:ring-emerald-500 dark:ring-emerald-700'
              : 'ring-slate-900/10 focus-within:ring-2 focus-within:ring-slate-900 dark:ring-white/15 dark:focus-within:ring-white'
        )}
      >
        <span className="pl-4 text-lg font-medium text-slate-400 select-none dark:text-slate-500">
          lin.ky/
        </span>
        <input
          id="pageSlug"
          name="pageSlug"
          type="text"
          value={slug}
          onChange={(ev) =>
            setFieldValue('pageSlug', sanitizeSlug(ev.target.value))
          }
          placeholder="your_name"
          autoFocus
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label="Handle"
          aria-describedby="pageSlug-status"
          className="w-full min-w-0 border-0 bg-transparent py-3.5 pr-4 pl-1 text-lg font-medium text-slate-900 placeholder:text-slate-300 focus:ring-0 focus:outline-none dark:text-white dark:placeholder:text-slate-600"
        />
      </label>

      <div
        id="pageSlug-status"
        aria-live="polite"
        className="mt-2.5 flex min-h-5 items-center gap-1.5 text-sm"
      >
        {showError ? (
          <>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500">
              <X className="size-3 text-white" strokeWidth={3} />
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">
              {error}
            </span>
          </>
        ) : availability === 'checking' ? (
          <>
            <Loader2 className="size-4 shrink-0 animate-spin text-slate-400" />
            <span className="text-slate-500 dark:text-slate-400">
              Checking availability…
            </span>
          </>
        ) : availability === 'available' ? (
          <>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-emerald-500">
              <Check className="size-3 text-white" strokeWidth={3} />
            </span>
            <span className="font-medium text-emerald-600 dark:text-emerald-400">
              This handle is available.
            </span>
          </>
        ) : availability === 'taken' ? (
          <>
            <span className="flex size-4 shrink-0 items-center justify-center rounded-full bg-red-500">
              <X className="size-3 text-white" strokeWidth={3} />
            </span>
            <span className="font-medium text-red-600 dark:text-red-400">
              That handle is taken — try another.
            </span>
          </>
        ) : availability === 'error' ? (
          <span className="text-amber-600 dark:text-amber-500">
            We couldn't check availability right now — we'll confirm it at the
            end.
          </span>
        ) : (
          <span className="text-slate-400 dark:text-slate-500">
            Lowercase letters, numbers, and underscores.
          </span>
        )}
      </div>
    </div>
  );
}
