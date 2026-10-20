/**
 * The API decodes and resizes uploads inside a Cloudflare Worker, which has a
 * 128MB memory limit. A full-size phone photo decodes to 50-200MB of raw
 * pixels and kills the Worker, so images are shrunk here first.
 *
 * 4 megapixels is still well above the largest size the API produces
 * (1200x800 page backgrounds), so nothing visible is lost.
 */
const MAX_PIXELS = 4_000_000;

/**
 * Returns a copy of `file` scaled down to at most MAX_PIXELS, or `file`
 * itself when it is already small enough or the browser cannot decode it
 * (the API then reports the problem, as before).
 */
export async function downscaleImage(file: File): Promise<File> {
  let bitmap: ImageBitmap;

  try {
    // Applies EXIF orientation, so rotated phone photos stay upright.
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const pixels = bitmap.width * bitmap.height;

    if (pixels <= MAX_PIXELS) {
      return file;
    }

    const scale = Math.sqrt(MAX_PIXELS / pixels);
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
