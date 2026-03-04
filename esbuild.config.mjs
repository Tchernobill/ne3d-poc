import esbuild from 'esbuild';

const mode = process.argv[2];
const production = mode === 'production';
const watch = mode === 'watch';

const ctx = await esbuild.context({
  entryPoints: ['main.ts'],
  bundle: true,
  outfile: 'main.js',
  format: 'cjs',
  external: ['obsidian'],
  sourcemap: !production,
  minify: production,
  target: 'es2018'
});

if (watch) {
  await ctx.watch();
  console.log('Watching...');
} else {
  await ctx.rebuild();
  await ctx.dispose();
}
