// @jsquash/* packages type their public APIs against the DOM's ambient
// `ImageData` interface, but this project's tsconfig deliberately doesn't
// include the "dom" lib (it would collide with @cloudflare/workers-types'
// own Request/Response/etc. declarations). Declare just enough of the shape
// jsquash actually reads (data/width/height/colorSpace) so the codec calls
// in modules/assets/image.ts typecheck without pulling in all of lib.dom.
export {};

declare global {
  interface ImageData {
    readonly data: Uint8ClampedArray;
    readonly width: number;
    readonly height: number;
    readonly colorSpace: 'srgb' | 'display-p3';
  }
}
