import { FunctionComponent } from 'react';

export const LinkBoxServerUI: FunctionComponent<{
  iconSrc?: string;
  title?: string;
  label?: string;
  showPreview?: boolean;
  previewImageUrl?: string;
  link?: string;
}> = async ({ iconSrc, title, label, showPreview, link }) => {
  if (showPreview) {
    return (
      <div className="flex flex-row gap-4 items-center relative h-full w-full">
        {showPreview && (
          <img
            src={`https://shots.lin.ky/take?url=${link}`}
            className="w-full h-full object-cover"
            alt={`Preview of ${link}`}
          />
        )}

        <div className="absolute bottom-0 left-0 w-full h-auto py-8 bg-gradient-to-b from-transparent to-black/80 group-hover:to-black/90 px-4 z-[2] flex flex-row items-center gap-4">
          <img src={iconSrc} className="w-10 h-10 rounded-md" alt="Link icon" />
          <div className="flex flex-col">
            <span className="font-semibold text-base text-white">{title}</span>
            {label && <span className="text-white text-xs">{label}</span>}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-4 items-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={iconSrc} className="w-10 h-10 rounded-md" alt="Link icon" />
      <div className="flex flex-col">
        <span className="font-semibold text-base text-sys-label-primary">
          {title}
        </span>
        {label && (
          <span className="text-sys-label-secondary text-xs">{label}</span>
        )}
      </div>
    </div>
  );
};
