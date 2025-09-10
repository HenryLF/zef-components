const { build } = require("esbuild");

// Common build configuration
const commonConfig = {
  bundle: true,
  minify: true,
  entryPoints: ["src/index.ts"],
  external: ["zustand/vanilla", "zustand/middleware"],
};

// CJS build
build({
  ...commonConfig,
  format: "cjs",
  outdir: "dist/cjs",
}).catch(() => process.exit(1));

// ESM build
build({
  ...commonConfig,
  format: "esm",
  outdir: "dist/esm",
}).catch(() => process.exit(1));
