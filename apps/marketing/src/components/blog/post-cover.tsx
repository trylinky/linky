import { LinkyMark } from '@/components/linky-mark';
import { cn } from '@trylinky/ui';
import Image from 'next/image';

// A post's featured image filling its box, or a tinted tile with the Linky
// mark for posts that don't have one.
export function PostCover({
  src,
  sizes,
  priority = false,
  className,
}: {
  src?: string;
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  return (
    <div className={cn('relative overflow-hidden bg-(--tint)', className)}>
      {src ? (
        <Image
          src={src}
          alt=""
          fill
          sizes={sizes}
          priority={priority}
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-(--accent)/40">
          <LinkyMark className="size-1/4 max-h-12 max-w-12" />
        </div>
      )}
    </div>
  );
}
