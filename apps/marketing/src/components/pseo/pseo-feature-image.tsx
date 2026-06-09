import Image, { StaticImageData } from 'next/image';
import { PseoBand, PseoEyebrow, PseoSectionHeading } from './pseo-section';

export function PseoFeatureImage({
  eyebrow,
  heading,
  body,
  imageSrc,
  imageAlt,
  reverse = false,
  minimal = false,
}: {
  eyebrow?: string;
  heading: string;
  body: string;
  imageSrc: StaticImageData;
  imageAlt: string;
  reverse?: boolean;
  minimal?: boolean;
}) {
  const textCol = (
    <div className="flex flex-col justify-center">
      {eyebrow &&
        (minimal ? (
          <p className="mb-3 flex items-center gap-2 text-sm font-medium text-zinc-500">
            <span className="inline-block h-px w-6 bg-zinc-300" />
            {eyebrow}
          </p>
        ) : (
          <div className="mb-3">
            <PseoEyebrow>{eyebrow}</PseoEyebrow>
          </div>
        ))}
      {minimal ? (
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 text-balance">
          {heading}
        </h2>
      ) : (
        <PseoSectionHeading>{heading}</PseoSectionHeading>
      )}
      <p className="mt-4 max-w-[52ch] text-lg leading-8 text-zinc-500 text-pretty">
        {body}
      </p>
    </div>
  );

  const imageCol = minimal ? (
    <div className="overflow-hidden rounded-2xl bg-white p-3 shadow-sm ring-1 ring-zinc-950/5">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={852}
        height={590}
        className="h-auto w-full rounded-xl object-cover ring-1 ring-zinc-950/5"
      />
    </div>
  ) : (
    <div className="rounded-2xl ring-1 ring-black/5 shadow-sm overflow-hidden">
      <Image
        src={imageSrc}
        alt={imageAlt}
        width={852}
        height={590}
        className="w-full h-auto object-cover"
      />
    </div>
  );

  const grid = (
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
  );

  if (minimal) {
    return (
      <section className="border-t border-zinc-950/5 bg-[#FAFAF9] py-20 md:py-28">
        <div className="mx-auto max-w-5xl px-4">{grid}</div>
      </section>
    );
  }

  return <PseoBand tone="beige">{grid}</PseoBand>;
}
