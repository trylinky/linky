// The Cloudflare Workers variant of the codec wasm loader. See
// wasm-loader.ts for the Node/default variant and why a manual loader is
// needed at all (@jsquash/*'s default `fetch(new URL(...))` init path
// doesn't work here either — workerd has no filesystem to fetch from, and
// more importantly `new WebAssembly.Module(bytes)` at request time is
// forbidden outright in workerd, the same restriction Task 2 hit with
// Prisma's query compiler). Wrangler's bundler resolves a plain `.wasm`
// import specifier to an already-compiled `WebAssembly.Module` at deploy
// time, which sidesteps that restriction entirely — no wrangler.jsonc
// changes were needed for this beyond the ambient `declare module '*.wasm'`
// type in types/wasm.d.ts (see the task report for what was and wasn't
// necessary).
import JPEG_DEC_WASM from '@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm';
import { init as initJpegDecode } from '@jsquash/jpeg/decode';
import PNG_WASM from '@jsquash/png/codec/pkg/squoosh_png_bg.wasm';
import { init as initPngDecode } from '@jsquash/png/decode';
import { init as initPngEncode } from '@jsquash/png/encode';
import { initResize } from '@jsquash/resize';
import RESIZE_WASM from '@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm';
import WEBP_DEC_WASM from '@jsquash/webp/codec/dec/webp_dec.wasm';
import WEBP_ENC_WASM from '@jsquash/webp/codec/enc/webp_enc.wasm';
import WEBP_ENC_SIMD_WASM from '@jsquash/webp/codec/enc/webp_enc_simd.wasm';
import { init as initWebpDecode } from '@jsquash/webp/decode';
import { init as initWebpEncode } from '@jsquash/webp/encode';
import { simd } from 'wasm-feature-detect';

let ready: Promise<void> | undefined;

/** Idempotent: safe to call before every encodeVariants() invocation. */
export function initCodecWasm(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      // Same reasoning as the Node loader: webp's encode() picks a SIMD or
      // non-SIMD wasm build at runtime, so we have to match that choice
      // when supplying the module ourselves. Both variants are bundled
      // (statically imported specifiers can't be chosen conditionally at
      // build time) — the unused one is dead weight, not a correctness
      // risk.
      const useSimdWebpEncoder = await simd();

      await Promise.all([
        initPngDecode(PNG_WASM),
        initPngEncode(PNG_WASM),
        initJpegDecode(JPEG_DEC_WASM),
        initWebpDecode(WEBP_DEC_WASM),
        initWebpEncode(useSimdWebpEncoder ? WEBP_ENC_SIMD_WASM : WEBP_ENC_WASM),
        initResize(RESIZE_WASM),
      ]);
    })();
  }
  return ready;
}
