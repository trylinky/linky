/**
 * The API decodes and resizes uploads inside a Cloudflare Worker, which has a
 * 128MB memory limit, and its pipeline needs roughly 20MB per megapixel of
 * source image. Anything much over a couple of megapixels fails, so images
 * are shrunk here to the smallest size that still covers the API's output.
 *
 * MAX_PIXELS is a backstop for extreme aspect ratios (a panorama would
 * otherwise stay very wide to cover the target height); those get upscaled
 * slightly by the API instead.
 */
const MAX_PIXELS = 2_000_000;

/**
 * Returns a copy of `file` scaled down so it just covers `target` (the size
 * the API crops to), or `file` itself when it is already small enough or the
 * browser cannot decode it (the API then reports the problem, as before).
 */
export async function downscaleImage(
  file: File,
  target: { width: number; height: number }
): Promise<File> {
  let bitmap: ImageBitmap;

  try {
    // Applies EXIF orientation, so rotated phone photos stay upright.
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const pixels = bitmap.width * bitmap.height;

    // The smallest scale at which the image still covers the target in both
    // dimensions, i.e. what the API's cover-crop needs.
    const coverScale = Math.max(
      target.width / bitmap.width,
      target.height / bitmap.height
    );
    const scale = Math.min(1, coverScale, Math.sqrt(MAX_PIXELS / pixels));

    if (scale >= 1) {
      return file;
    }

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext('2d');

    if (!context) {
      return file;
    }

    context.imageSmoothingQuality = 'high';
    context.drawImage(bitmap, 0, 0, width, height);

    // JPEG for photos; PNG for everything else so transparency survives
    // (icons and logos are usually PNG or WebP).
    const type = file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png';

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, type, 0.9)
    );

    if (!blob) {
      return file;
    }

    const extension = type === 'image/jpeg' ? 'jpg' : 'png';
    const name = file.name.replace(/\.[^.]*$/, '') + `.${extension}`;

    return new File([blob], name, { type });
  } finally {
    bitmap.close();
  }
}
