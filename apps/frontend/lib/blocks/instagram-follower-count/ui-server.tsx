import { fetchData } from './utils';
import Link from 'next/link';
import { FunctionComponent } from 'react';

export const InstagramLogo = () => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      className="stroke-sys-label-primary"
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

export const InstagramFollowerCountServerUI: FunctionComponent<{
  blockId: string;
}> = async ({ blockId }) => {
  const data = await fetchData({ blockId });

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
    <div className="flex flex-col justify-between h-full">
      <div className="flex justify-between">
        <div className="flex flex-col gap-2">
          <span className="uppercase font-bold text-xs tracking-wider text-sys-label-secondary">
            Followers
          </span>

          <span className="text-sys-label-primary text-4xl font-medium">
            {data.followerCount}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Link
          href={`https://www.instagram.com/${data.profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex gap-2 items-center"
        >
          <img
            src={data.profile.profilePictureUrl}
            alt="Profile picture"
            className="w-10 h-10 rounded-full"
          />
          <div className="flex flex-col">
            <span className="text-lg font-medium text-sys-label-primary">
              {data.profile.name}
            </span>
            <span className="text-xs font-medium text-sys-label-secondary -mt-1">
              @{data.profile.username}
            </span>
          </div>
        </Link>
        <Link
          href={`https://www.instagram.com/${data.profile.username}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <InstagramLogo />
        </Link>
      </div>
    </div>
  );
};
