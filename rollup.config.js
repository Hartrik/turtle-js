import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { string } from "rollup-plugin-string";
import image from "@rollup/plugin-image";
import terser from '@rollup/plugin-terser';
import pkg from './package.json';

export default [

    // browser-friendly UMD build - minimal
    {
        input: 'src/dist-single/main.js',
        output: {
            name: 'TurtleJS',
            file: pkg.browser_single,
            format: 'umd'
        },
        plugins: [
            resolve(), // so Rollup can find libraries
            commonjs(), // so Rollup can convert libraries to an ES modules
        ]
    },

    // browser-friendly UMD build - minimal - MINIMIZED
    {
        input: 'src/dist-single/main.js',
        output: {
            name: 'TurtleJS',
            file: pkg.browser_single_min,
            format: 'umd'
        },
        plugins: [
            resolve(), // so Rollup can find libraries
            commonjs(), // so Rollup can convert libraries to an ES modules

            terser()
        ]
    },

    // browser-friendly UMD build
    {
        input: 'src/dist-all/main.js',
        output: {
            name: 'TurtleJS',
            file: pkg.browser_all,
            format: 'umd'
        },
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
        ]
    },

    // browser-friendly UMD build - MINIMIZED
    {
        input: 'src/dist-all/main.js',
        output: {
            name: 'TurtleJS',
            file: pkg.browser_all_min,
            format: 'umd'
        },
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
            }),

            terser()
        ]
    }
];
