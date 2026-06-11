import path from "node:path";
import nunjucks from 'nunjucks';
import { splitGraphemes } from 'unicode-segmenter/grapheme';
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
                let database = await make_databases(sqlite3, load_csv);

                // Generate "all symbols" page
                // We can't use sqlite nocase, because it's not powerful enough
                let all_syms = [];
                database.exec(`
                    select distinct filename, caption from images
                    union select images.filename, cat_syms.override_caption as caption
                        from cat_syms join images on cat_syms.img_id = images.id where cat_syms.override_caption not null
                    `, {
                    rowMode: 'object',
                    resultRows: all_syms,
                });

                // Sort
                all_syms.sort((a, b) => {
                    let compare = String(a.caption).toUpperCase().localeCompare(String(b.caption).toUpperCase());
                    if (!compare)
                        return String(a.filename).localeCompare(String(b.filename));
                    return compare;
                });

                // Split by first letter
                let all_sym_first_letters = [];
                let all_syms_by_letter = new Map();
                for (let sym of all_syms) {
                    let graphemes = splitGraphemes(String(sym.caption));
                    let first_letter = graphemes.next().value.toUpperCase();
                    if (!all_syms_by_letter.has(first_letter)) {
                        all_sym_first_letters.push(first_letter);
                        all_syms_by_letter.set(first_letter, []);
                    }
                    all_syms_by_letter.get(first_letter).push(sym);
                }

                compilation.emitAsset("list.html", new RawSource(
                    nunjucks.render(path.resolve(__dirname, 'templates/list.html'), {
                        sym_first_letters: all_sym_first_letters,
                        syms_by_letter: all_syms_by_letter,
                        map_get: (m, k) => m.get(k),
                    })
                ));
            });
        });
    }
}

export default AACILCustomPlugin;
