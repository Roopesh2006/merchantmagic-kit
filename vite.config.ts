// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
//
// cloudflare: false  ← disables @cloudflare/vite-plugin so the SSR environment
// compiles as a Node.js server instead of a Cloudflare Worker.
// This is required for Vercel deployment — Vercel cannot run CF Worker binaries.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    server: { preset: "vercel" },
  },
});
