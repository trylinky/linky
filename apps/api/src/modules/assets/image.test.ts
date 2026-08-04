import { coverCrop } from './image';
import { describe, expect, it } from 'vitest';

// sharp's .resize(w, h) defaults to fit:cover, position:centre — it crops the
// source to the target aspect ratio and centres the crop. Replicating that
// exactly is the difference between "resized" and "reframed".
describe('coverCrop', () => {
  it('crops the sides of a too-wide source', () => {
    // 2000x1000 (2:1) into 1200x800 (3:2) -> keep full height, crop width
    expect(coverCrop(2000, 1000, 1200, 800)).toEqual({
      sx: 250,
      sy: 0,
      sWidth: 1500,
      sHeight: 1000,
    });
  });

  it('crops the top and bottom of a too-tall source', () => {
    // 1000x2000 (1:2) into 800x800 (1:1) -> keep full width, crop height
    expect(coverCrop(1000, 2000, 800, 800)).toEqual({
      sx: 0,
      sy: 500,
      sWidth: 1000,
      sHeight: 1000,
    });
  });

  it('does not crop a source that already matches the target ratio', () => {
    expect(coverCrop(2400, 1600, 1200, 800)).toEqual({
      sx: 0,
      sy: 0,
      sWidth: 2400,
      sHeight: 1600,
    });
  });

  it('upscales a small source rather than leaving it small', () => {
    // sharp does not set withoutEnlargement, so small images are enlarged.
    // The crop covers the whole source; the resize step does the enlarging.
    expect(coverCrop(100, 100, 800, 800)).toEqual({
      sx: 0,
      sy: 0,
      sWidth: 100,
      sHeight: 100,
    });
  });
});
