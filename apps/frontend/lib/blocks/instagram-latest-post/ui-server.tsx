import { formatDistance } from 'date-fns';
import Link from 'next/link';
import { FunctionComponent } from 'react';

import { fetchData } from './utils';

export const InstagramLogo = ({ stroke = '#fff' }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke={stroke}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
};

export const InstagramLatestPostServerUI: FunctionComponent<{
  blockId: string;
  numberOfPosts: number;
}> = async ({ blockId, numberOfPosts }) => {
  const data = await fetchData({ blockId, numberOfPosts });

  if (!data) {
    return (
      <div className="flex items-center justify-center h-full">
        <span className="text-sm text-sys-label-secondary text-center">
          Edit this block to connect your Instagram account.
        </span>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-x-auto snap-x snap-mandatory">
      <div className="w-auto h-full flex flex-row gap-3">
        {data.map((post: any) => {
          const formattedDate = post?.timestamp
            ? formatDistance(post?.timestamp, new Date(), {
                addSuffix: true,
              })
            : null;
          return (
            <div
              key={post?.imageUrl}
              className="w-full flex-shrink-0 relative snap-center"
            >
              {post?.mediaType === 'video' ? (
                <video
                  src={post?.imageUrl}
                  className="absolute w-full h-full object-cover"
                  autoPlay
                  muted
                  loop
                />
              ) : (
                <>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post?.imageUrl}
                    alt=""
                    className="absolute w-full h-full object-cover"
                  />
                </>
              )}
              <div className="absolute h-32 w-full bg-gradient-to-b from-transparent to-black bottom-0 z-10 px-6 py-6 flex flex-row justify-between items-end">
                <span className="flex flex-col">
                  <span className="text-white font-bold text-base">
                    @{post?.username}
                  </span>
                  <span className="text-white/70 text-sm">
                    Posted {formattedDate}
                  </span>
                </span>
                <Link
                  target="_blank"
                  rel="noopener noreferrer"
                  href={post?.link ?? ''}
                >
                  <InstagramLogo />
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
