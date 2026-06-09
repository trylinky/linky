import { cn } from '@trylinky/ui';

/** Shared minimal section heading: hairline eyebrow + semibold zinc heading. */
export function MinimalHeading({
  eyebrow,
  heading,
  body,
  center = false,
  className,
}: {
  eyebrow?: string;
  heading: string;
  body?: string;
  center?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(center && 'flex flex-col items-center text-center', className)}>
      {eyebrow && (
        <p className="flex items-center gap-2 text-sm font-medium text-zinc-500">
          <span className="inline-block h-px w-6 bg-zinc-300" />
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
        {heading}
      </h2>
      {body && (
        <p
          className={cn(
            'mt-4 text-lg text-zinc-500 text-pretty',
            center ? 'max-w-[52ch]' : 'max-w-[60ch]'
          )}
        >
          {body}
        </p>
      )}
    </div>
  );
}
