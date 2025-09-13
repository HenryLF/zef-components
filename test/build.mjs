import { build, context } from "esbuild";
const arg = process.argv.at(-1);

const config = {
  entryPoints: ["test/index.ts"],
  bundle: true,
  outdir: "test",
  minify: true,
};

if (arg == "dev") {
  const ctx = await context({
    ...config,
    minify: false,
  });
  await ctx.watch();
} else {
  await build({
    ...config,
  });
}
