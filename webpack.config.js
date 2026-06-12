import path from "node:path";
import { fileURLToPath } from "node:url";

import AACILCustomPlugin from "./src/build_site.js";
import CopyPlugin from 'copy-webpack-plugin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isProduction = process.env.NODE_ENV === "production";

/** @type {import("webpack").Configuration} */
const config = {
    entry: {
        frontend: "./src/frontend.js",
        editor: "./src/editor.js",
        search: "./src/search.js"
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, "site"),
    },
    devServer: {
        static: {
            directory: path.join(__dirname, "site"),
        },
    },
    plugins: [
        // Make sqlite WASM completely skip webpack
        new CopyPlugin({
            patterns: [{
                from: 'node_modules/@sqlite.org/sqlite-wasm/dist/',
                to: 'sqlite/',
            }],
        }),
        new AACILCustomPlugin(),
    ],
};

export default () => {
    if (isProduction) {
        config.mode = "production";
    } else {
        config.mode = "development";
    }
    return config;
};
