// The Node/default variant of the codec wasm loader (used by vitest, `pnpm
// dev` via tsx, and any other plain-Node execution of this code). See
// wasm-loader.workerd.ts for the Cloudflare Workers variant and
// apps/api/package.json's "imports" map (`#codec-wasm`) for how the right
// one gets picked — the same "workerd"-condition pattern Task 2 established
// for @trylinky/prisma's generated client.
//
// Every @jsquash/* codec defaults to `fetch(new URL('*.wasm', import.meta.url))`
// to load its wasm binary when no module is supplied. Node's fetch() does not
// support `file://` URLs ("TypeError: fetch failed" / "not implemented...
// yet..."), so that default path is unusable here. Each package's decode/
// encode/resize export also accepts an already-compiled `WebAssembly.Module`
// via its own `init`/`initResize` function, which skips the fetch entirely —
// this file reads each .wasm file from disk once and feeds it in that way.
import { init as initJpegDecode } from '@jsquash/jpeg/decode';
import { init as initPngDecode } from '@jsquash/png/decode';
import { init as initPngEncode } from '@jsquash/png/encode';
import { initResize } from '@jsquash/resize';
import { init as initWebpDecode } from '@jsquash/webp/decode';
import { init as initWebpEncode } from '@jsquash/webp/encode';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { simd } from 'wasm-feature-detect';

const require = createRequire(import.meta.url);

async function compile(specifier: string): Promise<WebAssembly.Module> {
  const path = require.resolve(specifier);
  return WebAssembly.compile(readFileSync(path));
}

let ready: Promise<void> | undefined;

/** Idempotent: safe to call before every encodeVariants() invocation. */
export function initCodecWasm(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      // webp's own `encode()` picks between a SIMD and non-SIMD wasm build
      // at runtime (see @jsquash/webp/encode.js), based on this exact
      // feature-detect check. We have to make the same choice ourselves
      // since we're supplying the compiled module manually — handing it the
      // SIMD wasm bytes while it loads the non-SIMD glue (or vice versa)
      // would mismatch the module's exports against what the glue expects.
      const useSimdWebpEncoder = await simd();

      const [pngWasm, jpegDecWasm, webpDecWasm, webpEncWasm, resizeWasm] =
        await Promise.all([
          compile('@jsquash/png/codec/pkg/squoosh_png_bg.wasm'),
          compile('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm'),
          compile('@jsquash/webp/codec/dec/webp_dec.wasm'),
          compile(
            useSimdWebpEncoder
              ? '@jsquash/webp/codec/enc/webp_enc_simd.wasm'
              : '@jsquash/webp/codec/enc/webp_enc.wasm'
          ),
          compile('@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm'),
        ]);

      await Promise.all([
        // png's decode and encode entry points each hold their own
        // module-scoped instance; both need to be handed the module.
        initPngDecode(pngWasm),
        initPngEncode(pngWasm),
        initJpegDecode(jpegDecWasm),
        initWebpDecode(webpDecWasm),
        initWebpEncode(webpEncWasm),
        initResize(resizeWasm),
      ]);
    })();
  }
  return ready;
}
