import esbuild from 'esbuild';

esbuild
  .build({
    entryPoints: ['lib/index.js'],
    bundle: true,
    outfile: 'extension.js',
    minify: false,
    sourcemap: true,
    target: ['es2015'],
    format: 'cjs',
    platform: 'node',
    external: ['gjs'],
    treeShaking: false
  })
  .catch(() => process.exit(1));
