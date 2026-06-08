import Image, { StaticImageData } from 'next/image';
import { PseoBand, PseoEyebrow, PseoSectionHeading } from './pseo-section';

export function PseoFeatureImage({
  eyebrow,
  heading,
  body,
  imageSrc,
  imageAlt,
  reverse = false,
}: {
  eyebrow?: string;
  heading: string;
  body: string;
  imageSrc: StaticImageData;
  imageAlt: string;
  reverse?: boolean;
}) {
  const textCol = (
    <div className="flex flex-col justify-center">
      {eyebrow && (
        <div className="mb-3">
          <PseoEyebrow>{eyebrow}</PseoEyebrow>
        </div>
      )}
      <PseoSectionHeading>{heading}</PseoSectionHeading>
      <p className="mt-4 text-lg text-gray-600 leading-relaxed">{body}</p>
    </div>
  );

  const imageCol = (
    <div className="rounded-2xl shadow-sm overflow-hidden">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={852}
        height={590}
        className="w-full h-auto object-cover"
      />
    </div>
  );

  return (
    <PseoBand tone="cream">
      <div className="grid md:grid-cols-2 gap-10 md:gap-16 items-center">
        {reverse ? (
          <>
            {imageCol}
            {textCol}
          </>
        ) : (
          <>
            {textCol}
            {imageCol}
          </>
        )}
      </div>
    </PseoBand>
  );
}
