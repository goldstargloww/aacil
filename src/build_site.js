import path from "node:path";
import nunjucks from 'nunjucks';
import { splitGraphemes } from 'unicode-segmenter/grapheme';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
const sqlite3 = await sqlite3InitModule();

import load_csv from './load_csv_nodejs.js';
import { make_databases } from './database.js';

const __dirname = new URL("..", import.meta.url).pathname;

function sort_syms(a, b) {
    // First check the caption...
    let compare = String(a.caption).toUpperCase().localeCompare(String(b.caption).toUpperCase());
    if (!compare)
        // ...then check the filename if they're identical
        return String(a.filename).localeCompare(String(b.filename));
    return compare;
}

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

                // Generate all category pages and the main page.
                // Also collect the information needed to build the map page (TODO)
                function make_category_page(cat_id, url_path_components = []) {
                    console.log(cat_id, url_path_components);

                    // Look up information about this category
                    let cat_info = [];
                    database.exec(`select url_path, cw, have_subcat_icons from categories where id=?`, {
                        bind: [cat_id],
                        rowMode: 'object',
                        resultRows: cat_info
                    });
                    cat_info = cat_info[0];
                    // console.log(cat_info);

                    // Clone this
                    let new_url_path_components = url_path_components.slice(0);

                    // Look up information about subcategories
                    let subcats = [];
                    database.exec(`
                        select subcategories.child_id as id,
                               categories.desc,
                               categories.url_path,
                               categories.icon_id,
                               images.filename as icon_url
                        from subcategories
                        join categories on subcategories.child_id = categories.id
                        left join images on categories.icon_id = images.id
                        where subcategories.parent_id=?`, {
                        bind: [cat_id],
                        rowMode: 'object',
                        resultRows: subcats,
                    });
                    // console.log(subcats);

                    if (cat_id != 0) {
                        // A normal category page
                        new_url_path_components.push(cat_info.url_path);

                        // Look up all the symbols that belong on this page
                        let syms = [];
                        database.exec(`
                            select filename, caption, alt_text, cw_id
                            from images join cat_syms on cat_syms.img_id = images.id
                            where cat_syms.cat_id=?`, {
                            bind: [cat_id],
                            rowMode: 'object',
                            resultRows: syms,
                        });
                        // console.log(syms);

                        // cw_id --> text, or null for one that is suppressed
                        let cw_info = new Map();
                        for (let sym of syms) {
                            // Look up if not cached
                            if (sym.cw_id !== null && !cw_info.has(sym.cw_id)) {
                                let cw_text = []
                                database.exec(`select text from page_cw where id=?`, {
                                    bind: [sym.cw_id],
                                    resultRows: cw_text,
                                });
                                cw_text = cw_text[0]

                                let cw_suppress = []
                                database.exec(`select * from cw_suppressions where cat_id=? and cw_id=?`, {
                                    bind: [cat_id, sym.cw_id],
                                    resultRows: cw_suppress,
                                });
                                cw_suppress = cw_suppress.length > 0;

                                if (cw_suppress)
                                    cw_info.set(sym.cw_id, null);
                                else
                                    cw_info.set(sym.cw_id, cw_text)
                            }

                            // Apply suppression
                            if (cw_info.get(sym.cw_id) === null)
                                sym.cw_id = null;
                        }
                        // console.log(cw_info);
                        // console.log(syms);

                        // Sort into CW categories
                        let syms_by_cw = new Map();
                        for (let sym of syms) {
                            let cw_id = sym.cw_id;
                            delete sym.cw_id;
                            if (!syms_by_cw.has(cw_id))
                                syms_by_cw.set(cw_id, []);
                            syms_by_cw.get(cw_id).push(sym);
                        }
                        // console.log(syms_by_cw);

                        // Sort the CWs in order by their text
                        let sym_cw_ordered_ids = Array.from(syms_by_cw.keys())
                        sym_cw_ordered_ids.sort((a, b) => {
                            // null is always less than everything else
                            if (a === null) return -1;
                            if (b === null) return 1;
                            a = cw_info.get(a);
                            b = cw_info.get(b);
                            return a.toUpperCase().localeCompare(b.toUpperCase());
                        });

                        // Sort each set of symbols
                        for (let sym_set of syms_by_cw.values()) {
                            sym_set.sort(sort_syms);
                        }
                        // console.log(syms_by_cw);

                        let main_syms = syms_by_cw.get(null);
                        let cw_syms = [];
                        for (let cw_id of sym_cw_ordered_ids) {
                            if (cw_id !== null) {
                                cw_syms.push({
                                    cw: cw_info.get(cw_id),
                                    syms: syms_by_cw.get(cw_id),
                                });
                            }
                        }
                        // console.log(main_syms);

                        let emit_asset_path = new_url_path_components.join('/') + '/index.html';
                        compilation.emitAsset(emit_asset_path, new RawSource(
                            nunjucks.render(path.resolve(__dirname, 'templates/category.html'), {
                                main_syms,
                                // sym_first_letters: all_sym_first_letters,
                                // syms_by_letter: all_syms_by_letter,
                                // map_get: (m, k) => m.get(k),
                            })
                        ));
                    } else {
                        // TODO: Main page
                        new_url_path_components.push('');
                    }

                    // Recurse
                    for (let subcat of subcats) {
                        make_category_page(subcat.id, new_url_path_components);
                    }
                }
                make_category_page(0);

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
                all_syms.sort(sort_syms);

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
