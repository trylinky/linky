import { initCodecWasm } from '#codec-wasm';
import decodeJpeg from '@jsquash/jpeg/decode';
import { decode as decodePng, encode as encodePng } from '@jsquash/png';
import resize from '@jsquash/resize';
import { encode as encodeWebp } from '@jsquash/webp';
import decodeWebp from '@jsquash/webp/decode';

// Two things every @jsquash/* codec needs help with in both Node and
// Cloudflare Workers (neither is a browser):
//
// 1. None of them define a native `ImageData` global, which
//    `@jsquash/resize`'s wasm-bindgen glue constructs internally
//    (`new ImageData(...)`) without checking for one first. Every @jsquash/*
//    codec's own wasm glue self-installs a `globalThis.ImageData` polyfill
//    at module load time when it detects Node or CF Workers, so importing
//    decodePng/decodeJpeg/decodeWebp above (all three, unconditionally,
//    regardless of which format a given upload turns out to be) guarantees
//    the polyfill exists before resize() ever runs.
// 2. Their default wasm-loading path is `fetch(new URL('*.wasm',
//    import.meta.url))`, which doesn't work in either runtime (Node's
//    fetch() can't load `file://` URLs; workerd forbids compiling wasm from
//    bytes at request time regardless). `initCodecWasm()` — resolved to a
//    Node or a Workers implementation via the "#codec-wasm" import and
//    package.json's "workerd"/"default" conditions — manually compiles (or,
//    on Workers, statically imports) each .wasm file once and feeds it to
//    the codecs' own `init`/`initResize` functions, bypassing fetch
//    entirely. See the task report for how this was verified in both
//    environments.

/**
 * Replicates sharp's `.resize(w, h)` default of fit:cover, position:centre —
 * crop the source to the target aspect ratio, centred, then scale.
 *
 * Getting this wrong does not error, it just silently reframes every image a
 * user has ever uploaded, so it is unit-tested separately from the codecs.
 */
export function coverCrop(
  width: number,
  height: number,
  targetWidth: number,
  targetHeight: number
): { sx: number; sy: number; sWidth: number; sHeight: number } {
  const sourceRatio = width / height;
  const targetRatio = targetWidth / targetHeight;

  if (sourceRatio > targetRatio) {
    // Source is too wide: keep full height, crop the sides.
    const sWidth = Math.round(height * targetRatio);
    return {
      sx: Math.round((width - sWidth) / 2),
      sy: 0,
      sWidth,
      sHeight: height,
    };
  }

  if (sourceRatio < targetRatio) {
    // Source is too tall: keep full width, crop top and bottom.
    const sHeight = Math.round(width / targetRatio);
    return {
      sx: 0,
      sy: Math.round((height - sHeight) / 2),
      sWidth: width,
      sHeight,
    };
  }

  return { sx: 0, sy: 0, sWidth: width, sHeight: height };
}

function toArrayBuffer(source: Uint8Array): ArrayBuffer {
  return source.buffer.slice(
    source.byteOffset,
    source.byteOffset + source.byteLength
  ) as ArrayBuffer;
}

/**
 * Sniffs magic bytes rather than trusting the client-supplied content-type.
 * Uploads are PNG, JPEG or WebP in practice (phones sometimes send HEIC/AVIF,
 * but this API has never accepted those — sharp would have thrown on them
 * too). Failing loudly here beats silently feeding an unknown format to the
 * JPEG decoder and shipping garbage bytes to the CDN.
 */
function sniffFormat(source: Uint8Array): 'png' | 'jpeg' | 'webp' {
  if (
    source[0] === 0x89 &&
    source[1] === 0x50 &&
    source[2] === 0x4e &&
    source[3] === 0x47
  ) {
    return 'png';
  }

  if (source[0] === 0xff && source[1] === 0xd8 && source[2] === 0xff) {
    return 'jpeg';
  }

  if (
    source[0] === 0x52 &&
    source[1] === 0x49 &&
    source[2] === 0x46 &&
    source[3] === 0x46 &&
    source[8] === 0x57 &&
    source[9] === 0x45 &&
    source[10] === 0x42 &&
    source[11] === 0x50
  ) {
    return 'webp';
  }

  throw new Error(
    'Unrecognised image format: expected PNG, JPEG or WebP magic bytes'
  );
}

async function decode(source: Uint8Array): Promise<ImageData> {
  const format = sniffFormat(source);
  const buffer = toArrayBuffer(source);

  switch (format) {
    case 'png':
      return decodePng(buffer);
    case 'webp':
      return decodeWebp(buffer);
    case 'jpeg':
      return decodeJpeg(buffer);
  }
}

function crop(
  image: ImageData,
  region: ReturnType<typeof coverCrop>
): ImageData {
  const { sx, sy, sWidth, sHeight } = region;

  if (
    sx === 0 &&
    sy === 0 &&
    sWidth === image.width &&
    sHeight === image.height
  ) {
    return image;
  }

  const output = new Uint8ClampedArray(sWidth * sHeight * 4);

  for (let row = 0; row < sHeight; row++) {
    const sourceStart = ((sy + row) * image.width + sx) * 4;
    output.set(
      image.data.subarray(sourceStart, sourceStart + sWidth * 4),
      row * sWidth * 4
    );
  }

  return { data: output, width: sWidth, height: sHeight, colorSpace: 'srgb' };
}

/** Produces the webp and png variants the CDN serves, from one source buffer. */
export async function encodeVariants(
  source: Uint8Array,
  config: { width: number; height: number; quality: number }
): Promise<{ webp: Uint8Array; png: Uint8Array }> {
  await initCodecWasm();

  const decoded = await decode(source);

  const cropped = crop(
    decoded,
    coverCrop(decoded.width, decoded.height, config.width, config.height)
  );

  // No `fitMethod` override: jsquash's default is 'stretch', which scales
  // the already-cropped region to exactly config.width x config.height. The
  // cropping above is what does sharp's "cover" framing; this step is a
  // plain scale, matching sharp's lack of withoutEnlargement (small sources
  // get upscaled here rather than left small).
  const resized = await resize(cropped, {
    width: config.width,
    height: config.height,
  });

  // png() has no quality knob in jsquash — sharp's `quality` there drove
  // palette quantisation, which has no equivalent. Output is visually
  // identical; byte size will differ.
  const [webp, png] = await Promise.all([
    encodeWebp(resized, { quality: config.quality }),
    encodePng(resized),
  ]);

  return { webp: new Uint8Array(webp), png: new Uint8Array(png) };
}
