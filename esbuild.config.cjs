const { build } = require("esbuild");

// Common build configuration
const commonConfig = {
  bundle: true,
  minify: true,
  external: ["react", "react-dom"],
  entryPoints: ["src/index.ts", "src/hooks/*.ts"],
  platform: "node",
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
