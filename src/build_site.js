import path from "node:path";

import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
const sqlite3 = await sqlite3InitModule();

import load_csv from './load_csv_nodejs.js';
import { make_databases } from './database.js';

const __dirname = new URL("..", import.meta.url).pathname;

class AACILCustomPlugin {
    apply(compiler) {
        const pluginName = AACILCustomPlugin.name;

        const { webpack } = compiler;
        const { Compilation } = webpack;
        const { RawSource } = webpack.sources;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.contextDependencies.add(path.resolve(__dirname, "site/database"));
            compilation.contextDependencies.add(path.resolve(__dirname, "templates"));

            compilation.hooks.processAssets.tapPromise({
                name: pluginName,
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, async (_assets) => {
                await make_databases(sqlite3, load_csv);
            });
        });
    }
}

export default AACILCustomPlugin;
