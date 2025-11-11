import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import dts from 'rollup-plugin-dts';
import terser from '@rollup/plugin-terser';
import peerDepsExternal from 'rollup-plugin-peer-deps-external';
import postcss from 'rollup-plugin-postcss';
import packageJson from './package.json' with { type: 'json' };
import esbuild from 'rollup-plugin-esbuild';


export default [
	{
		input: 'src/index.ts',
		output: [
			{
				file: packageJson.main,
				format: 'cjs',
				sourcemap: true,
			},
			{
				file: packageJson.module,
				format: 'esm',
				sourcemap: true,
			},
		],
		plugins: [
			postcss(),
			peerDepsExternal(),
			resolve({ extensions: ['.js', '.jsx', '.ts', '.tsx','.css','.module.css'] }),
			commonjs(),
			esbuild({ tsconfig: './tsconfig.lib.json'}),
			terser(),
		],
		external: ['react', 'react-dom'],
	},
	{
		input: 'src/index.ts',
		output: [{ file: packageJson.types }],
		plugins: [dts(),postcss()],
		external: [/\.css/, /\.module.css/],
	},
];
