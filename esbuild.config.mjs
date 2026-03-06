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
  format: "cjs",
  platform: "browser",
  target: "es2018",
  mainFields: ["module", "main"],
  conditions: ["import"],
  // 🛠️ THE FIX: The '$' forces an EXACT match, eliminating the Multiple Instances bug
  alias: {
    "three$": "three/build/three.module.js"
  },
  external:[
    "obsidian",
    "electron",
    ...builtins
  ],
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