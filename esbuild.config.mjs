import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import esbuildSvelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const mode = process.argv[2];
const prod = mode === "production";
const watch = mode === "watch";

const context = await esbuild.context({
  entryPoints:["src/main.ts"],
  bundle: true,
  external:[
    "obsidian",
    "electron",
    ...builtins
  ],
  format: "cjs",
  target: "es2018",
  mainFields:["module", "main"],
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  plugins:[
    esbuildSvelte({
      compilerOptions: { css: "injected" },
      preprocess: sveltePreprocess(),
    }),
  ],
});

if (watch) {
  await context.watch();
  console.log("Watching for changes...");
} else {
  await context.rebuild();
  console.log("Build complete.");
  process.exit(0);
}