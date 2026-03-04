// esbuild.config.mjs
import esbuild from "esbuild";
import process from "process";
import builtins from "builtin-modules";
import esbuildSvelte from "esbuild-svelte";
import sveltePreprocess from "svelte-preprocess";

const prod = (process.argv[2] === "production");

const context = await esbuild.context({
  banner: { js: "/* NE3D Proof of Concept */" },
  entryPoints: ["src/main.ts"],
  bundle: true,
  external:[
    "obsidian",
    "electron",
    ...builtins
  ],
  format: "cjs",
  target: "es2018",
  logLevel: "info",
  sourcemap: prod ? false : "inline",
  treeShaking: true,
  outfile: "main.js",
  plugins:[
    esbuildSvelte({
      compilerOptions: { css: "injected" }, // Injects Svelte CSS directly into the JS bundle
      preprocess: sveltePreprocess(),
    }),
  ],
});

if (prod) {
  await context.rebuild();
  process.exit(0);
} else {
  await context.watch();
}