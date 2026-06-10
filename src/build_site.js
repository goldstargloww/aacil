import fs from "node:fs";
import path from "node:path";

import { parse as csv_parse } from 'csv-parse';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
const sqlite3 = await sqlite3InitModule();

const __dirname = new URL("..", import.meta.url).pathname;

class AACILCustomPlugin {
    apply(compiler) {
        const pluginName = AACILCustomPlugin.name;

        const { webpack } = compiler;
        const { Compilation } = webpack;
        const { RawSource } = webpack.sources;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.contextDependencies.add(path.resolve(__dirname, "database"));
            compilation.contextDependencies.add(path.resolve(__dirname, "templates"));

            compilation.hooks.processAssets.tapPromise({
                name: pluginName,
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, async (_assets) => {
                console.log("Hello world!", sqlite3);

                const parser = fs.createReadStream(`${__dirname}/site/AAC/aac.csv`).pipe(
                    csv_parse({
                        columns: true,
                    }),
                );
                let data = "";
                for await (const record of parser) {
                    data += `${record["Image URL"]}\n`;
                }

                compilation.emitAsset("testtesttest", new RawSource(data));
            });
        });
    }
}

export default AACILCustomPlugin;
