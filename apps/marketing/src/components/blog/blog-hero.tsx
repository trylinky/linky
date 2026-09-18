import type { CSSProperties } from 'react';

// The brand confetti from the marketing hubs, kept to the outer margins so it
// never lands on the centred headline.
const confetti = [
  { color: '#07B151', top: '22%', left: '4%', size: 12, square: false },
  { color: '#FBB40F', top: '70%', left: '11%', size: 10, square: true },
  { color: '#733B97', top: '38%', left: '17%', size: 7, square: false },
  { color: '#2357BC', top: '14%', left: '86%', size: 9, square: false },
  { color: '#E8553F', top: '56%', left: '94%', size: 12, square: false },
  { color: '#FBB40F', top: '84%', left: '81%', size: 8, square: true },
];

export function BlogHero({
  page,
  pageCount,
}: {
  page: number;
  pageCount: number;
}) {
  return (
    <header className="relative isolate flex flex-col items-center py-6 text-center md:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 max-md:hidden"
      >
        {confetti.map((piece, i) => (
          <span
            key={i}
            data-square={piece.square || undefined}
            className="absolute top-(--top) left-(--left) size-(--size) rounded-full bg-(--color) data-square:rotate-20 data-square:rounded-sm"
            style={
              {
                '--top': piece.top,
                '--left': piece.left,
                '--size': `${piece.size}px`,
                '--color': piece.color,
              } as CSSProperties
            }
          />
        ))}
      </div>
      <h1 className="max-w-[20ch] text-5xl font-semibold tracking-tight text-balance md:text-6xl">
        Notes on making a better link in bio.
      </h1>
      <p className="mt-5 max-w-[48ch] text-lg text-pretty text-(--ink-soft)">
        Product updates, tutorials, and advice from the Linky team.
        {page > 1 && ` Page ${page} of ${pageCount}.`}
      </p>
    </header>
  );
}
