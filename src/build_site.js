import fs from "node:fs";
import sqlite from 'node:sqlite';
import { parse as csv_parse } from 'csv-parse';

const __dirname = new URL("../site", import.meta.url).pathname;

class AACILCustomPlugin {
    apply(compiler) {
        const pluginName = AACILCustomPlugin.name;

        const { webpack } = compiler;
        const { Compilation } = webpack;
        const { RawSource } = webpack.sources;

        compiler.hooks.thisCompilation.tap(pluginName, (compilation) => {
            compilation.hooks.processAssets.tapPromise({
                name: pluginName,
                stage: Compilation.PROCESS_ASSETS_STAGE_ADDITIONAL,
            }, async (_assets) => {
                console.log("Hello world!", sqlite);

                const parser = fs.createReadStream(`${__dirname}/AAC/aac.csv`).pipe(
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
