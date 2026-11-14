import { copyFile, mkdir, rm } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { build, context } from "esbuild";
import type { BuildOptions } from "esbuild";

const root = fileURLToPath(new URL("../", import.meta.url));
await rm(new URL("../dist/", import.meta.url), { recursive: true, force: true });

const options: BuildOptions = {
  absWorkingDir: root,
  entryPoints: ["src/content.ts", "src/content.css"],
  outdir: "dist",
  bundle: true,
  format: "iife",
  target: "firefox142",
  legalComments: "none",
  logLevel: "info",
  plugins: [
    {
      name: "manifest",
      setup(builder) {
        builder.onEnd(async (result) => {
          if (result.errors.length > 0) {
            return;
          }

          await mkdir(new URL("../dist/", import.meta.url), { recursive: true });
          await copyFile(
            new URL("../extension/manifest.json", import.meta.url),
            new URL("../dist/manifest.json", import.meta.url),
          );
        });
      },
    },
  ],
};

if (process.argv.includes("--watch")) {
  const builder = await context(options);
  await builder.watch();
} else {
  await build(options);
}
