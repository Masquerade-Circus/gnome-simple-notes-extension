import esbuild from 'esbuild';

const isProduction = process.env.NODE_ENV === 'production';

const entrypoint = isProduction ? 'lib/index.js' : 'lib/index.dev.js';

esbuild
  .build({
    entryPoints: [entrypoint],
    bundle: true,
    outfile: 'extension.js',
    minify: false,
    sourcemap: !isProduction,
    target: ['es2015'],
    format: 'cjs',
    platform: 'node',
    external: ['gjs'],
    treeShaking: false
  })
  .catch(() => process.exit(1));
