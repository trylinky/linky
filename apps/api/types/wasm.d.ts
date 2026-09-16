// Cloudflare Workers (via Wrangler's bundler) supports importing `.wasm`
// files directly, resolving to an already-compiled `WebAssembly.Module` —
// this is how modules/assets/wasm-loader.workerd.ts feeds the jsquash
// codecs their wasm binaries without ever calling `new WebAssembly.Module`
// at request time (which workerd forbids). TypeScript has no ambient type
// for `.wasm` specifiers, hence this wildcard declaration.
declare module '*.wasm' {
  const wasmModule: WebAssembly.Module;
  export default wasmModule;
}

// Two of the six .wasm files modules/assets/wasm-loader.{ts,workerd.ts}
// import (@jsquash/png's and @jsquash/resize's, both wasm-bindgen output)
// ship a real, co-located `squoosh_*_bg.wasm.d.ts` declaring their raw
// low-level named exports (encode/decode/memory/etc) with no default
// export. TypeScript resolves that literal file ahead of the wildcard
// declaration above (an exact match always wins over `*.wasm`), so without
// this override those two imports fail with "has no default export" even
// though Wrangler's actual bundler — and Node's WebAssembly.compile() in
// the Node loader — both give a plain WebAssembly.Module. Exact-specifier
// ambient declarations take priority over a package's own shipped types,
// same mechanism as shimming an untyped npm package.
declare module '@jsquash/png/codec/pkg/squoosh_png_bg.wasm' {
  const wasmModule: WebAssembly.Module;
  export default wasmModule;
}
declare module '@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm' {
  const wasmModule: WebAssembly.Module;
  export default wasmModule;
}

// `@cloudflare/workers-types` deliberately declares a narrower
// `WebAssembly` namespace than lib.dom.d.ts — it omits `compile`/
// `instantiate(bytes)` because workerd forbids compiling wasm from raw
// bytes at request time (the same restriction Task 2 hit with Prisma's
// query compiler; see wasm-loader.ts's file-level comment). That's correct
// for the Workers runtime, but this tsconfig's "types" array applies
// globally, and modules/assets/wasm-loader.ts (the Node/default variant)
// genuinely needs `WebAssembly.compile` — Node has always had it. This
// merges back in only the one member the Node loader uses; the Workers
// loader never calls it.
declare namespace WebAssembly {
  function compile(bytes: BufferSource): Promise<Module>;
}
