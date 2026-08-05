import path from "node:path";
import nunjucks from 'nunjucks';
import { splitGraphemes } from 'unicode-segmenter/grapheme';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
const sqlite3 = await sqlite3InitModule();

import load_csv from './load_csv_nodejs.js';
import { build_site } from './build_site.js';

import Os from 'os'
let __dirname = new URL("..", import.meta.url).pathname;
if (Os.platform() === 'win32' && __dirname.startsWith('/')) {
    __dirname = __dirname.slice(1);
}

nunjucks.configure(path.resolve(__dirname, 'templates'));

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
                await build_site(sqlite3, load_csv, (page_path, page_contents) => {
                    compilation.emitAsset(page_path, new RawSource(page_contents));
                })
            });
        });
    }
}

export default AACILCustomPlugin;
