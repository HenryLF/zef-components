import { build, context } from "esbuild";
const arg = process.argv.at(-1);

const config = {
  entryPoints: [
    "exemples/user-profile/index.ts",
    "exemples/smart-list/index.ts",
    "exemples/todo-list/index.ts",
  ],
  bundle: true,
  outdir: "exemples",
  outbase: "exemples",
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
