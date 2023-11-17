import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { string } from "rollup-plugin-string";
import image from "@rollup/plugin-image";
import terser from '@rollup/plugin-terser';
import pkg from './package.json';

export default [

    // app
    {
        input: 'src/app/main.js',
        plugins: [
            resolve(), // so Rollup can find libraries
            commonjs(), // so Rollup can convert libraries to an ES modules
            string({
                include: "assets/*.turtle",
                exclude: []
            }),
            image({
                include: "assets/*.png",
                exclude: []
            })
        ],
        output: [
            {
                // browser-friendly UMD build
                name: 'TurtleJS',
                file: 'dist/turtle-js.umd.js',
                banner: pkg.copyright,
                format: 'umd',
                sourcemap: true,
            },
            {
                // browser-friendly UMD build, MINIMIZED
                name: 'TurtleJS',
                file: 'dist/turtle-js.umd.min.js',
                format: 'umd',
                sourcemap: true,
                plugins: [
                    terser({
                        sourceMap: true,
                        format: {
                            preamble: pkg.copyright,
                            comments: false
                        }
                    })
                ]
            }
        ]
    }
];
