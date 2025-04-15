import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import replace from '@rollup/plugin-replace';
import terser from '@rollup/plugin-terser';
import typescript from '@rollup/plugin-typescript';
import { glob } from 'glob';
import fs from 'fs-extra';
import path from 'path';

import pkg from './package.json';

const input = './src/index.ts';

export default {
  input,
  output: [
    {
      format: 'cjs',
      exports: 'auto',
      file: 'dist/index.cjs.js',
      sourcemap: true,
    },
    {
      format: 'es',
      file: 'dist/index.esm.js',
      sourcemap: true,
    },
    {
      format: 'umd',
      name: pkg.name
        .split('-')
        .map(([s, ...rest]) => [s.toUpperCase(), ...rest].join(''))
        .join(''),
      file: pkg.unpkg,
      sourcemap: true,
      globals: {
        mutative: 'Mutative',
        zustand: 'Zustand',
        react: 'React',
      },
      exports: 'named',
    },
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({
      declaration: true,
      declarationDir: 'dist',
    }),
    replace({
      __DEV__: 'false',
      preventAssignment: true,
    }),
    terser(),
    {
      name: 'copy-dts-to-dmts',
      writeBundle(options, bundle) {
        console.log('Copying .d.ts to .d.mts...');

        const files = glob.sync(`dist/**/*.d.ts`, { absolute: true });
        files.forEach((filePath) => {
          const mtsPath = filePath.replace(/\.d\.ts$/, '.d.mts');
          try {
            fs.copySync(filePath, mtsPath);
            console.log(
              `  Copied ${path.basename(filePath)} to ${path.basename(mtsPath)}`
            );
          } catch (err) {
            console.error(`  Error copying ${filePath} to ${mtsPath}:`, err);
          }
        });
        console.log('.d.mts generation complete.');
      },
    },
  ],
  external: ['mutative', 'zustand', 'react'],
};
