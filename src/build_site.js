import path from "node:path";
import nunjucks from 'nunjucks';
import { splitGraphemes } from 'unicode-segmenter/grapheme';
import sqlite3InitModule from '@sqlite.org/sqlite-wasm';
const sqlite3 = await sqlite3InitModule();

import load_csv from './load_csv_nodejs.js';
import { make_databases } from './database.js';
import * as sorting from './sorting.js';

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

                // Generate all category pages and the main page.
                // Also collect the information needed to build the map page (TODO)
                function make_category_page(cat_id, children_out, url_path_components = []) {
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
                               categories.cw,
                               images.filename as icon_url
                        from subcategories
                        join categories on subcategories.child_id = categories.id
                        left join images on categories.icon_id = images.id
                        where subcategories.parent_id=?`, {
                        bind: [cat_id],
                        rowMode: 'object',
                        resultRows: subcats,
                    });
                    // ...and sort it
                    subcats.sort(sorting.sort_categories);

                    // Munge the subcategory data
                    let subcats_for_page = subcats.map((subcat) => {
                        let ret = {
                            desc: subcat.desc,
                        };

                        if (subcat.cw !== null)
                            ret.url_path = `${subcat.url_path}/warning.html`;
                        else
                            ret.url_path = `${subcat.url_path}/`;

                        if (cat_info.have_subcat_icons)
                            ret.icon_url = subcat.icon_url;
                        return ret;
                    });

                    if (cat_id != 0) {
                        // A normal category page
                        new_url_path_components.push(cat_info.url_path);

                        // Look up all the symbols that belong on this page
                        let syms = [];
                        database.exec(`
                            select id as img_id, filename, caption, alt_text, cw_id, override_caption
                            from images join cat_syms on cat_syms.img_id = images.id
                            where cat_syms.cat_id=?`, {
                            bind: [cat_id],
                            rowMode: 'object',
                            resultRows: syms,
                        });

                        // Look up the artist credits for symbols
                        for (let sym of syms) {
                            let img_id = sym.img_id;
                            delete sym.img_id;

                            if (sym.override_caption) {
                                sym.caption = sym.override_caption;
                                delete sym.override_caption;
                            }

                            let artist_credits = [];
                            database.exec(`
                                select artists.display from artists
                                join sym_artists on sym_artists.artist_id = artists.id
                                where sym_artists.img_id=?`, {
                                bind: [img_id],
                                resultRows: artist_credits
                            });
                            artist_credits = artist_credits.map((x) => x[0]);
                            artist_credits.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

                            let artist_derived_from_credits = [];
                            database.exec(`
                                select artists.display from artists
                                join sym_derived_from on sym_derived_from.artist_id = artists.id
                                where sym_derived_from.img_id=?`, {
                                bind: [img_id],
                                resultRows: artist_derived_from_credits
                            });
                            artist_derived_from_credits = artist_derived_from_credits.map((x) => x[0]);
                            artist_derived_from_credits.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

                            // Make it pretty
                            if (artist_credits.length === 0) {
                                console.warn(`${img_id} ${sym.filename} doesn't have artist credits`);
                                artist_credits = "<unknown>";
                            } else {
                                artist_credits = artist_credits.join(" & ");
                            }

                            if (artist_derived_from_credits.length > 0) {
                                artist_derived_from_credits = artist_derived_from_credits.join(" & ");
                                artist_credits += `, adapted from ${artist_derived_from_credits}`;
                            }
                            sym.credit = artist_credits;
                        }

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
                                cw_text = cw_text[0][0];

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

                        // Sort into CW categories
                        let syms_by_cw = new Map();
                        for (let sym of syms) {
                            let cw_id = sym.cw_id;
                            delete sym.cw_id;
                            if (!syms_by_cw.has(cw_id))
                                syms_by_cw.set(cw_id, []);
                            syms_by_cw.get(cw_id).push(sym);
                        }

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
                            sym_set.sort(sorting.sort_syms);
                        }

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

                        let emit_asset_path = new_url_path_components.join('/') + '/index.html';
                        compilation.emitAsset(emit_asset_path, new RawSource(
                            nunjucks.render(path.resolve(__dirname, 'templates/category.html'), {
                                subcats: subcats_for_page,
                                main_syms,
                                cw_syms,
                            })
                        ));

                        if (cat_info.cw !== null) {
                            // Interstitial warning page
                            let emit_asset_path = new_url_path_components.join('/') + '/warning.html';
                            compilation.emitAsset(emit_asset_path, new RawSource(
                                nunjucks.render(path.resolve(__dirname, 'templates/warning.html'), {
                                    cw: cat_info.cw,
                                })
                            ));
                        }
                    } else {
                        // Main page
                        new_url_path_components.push('');

                        // Deal with artist names
                        let all_artists = [];
                        database.exec(`select display, front_page_footnote, front_page_parens from artists`, {
                            rowMode: 'object',
                            resultRows: all_artists,
                        });

                        // Deal with sorting
                        all_artists.sort(sorting.sort_artists);

                        // Add parens and footnotes
                        let artist_footnotes = [];
                        all_artists = all_artists.map((x) => {
                            let display = x.display;

                            if (x.front_page_parens !== null)
                                display = `${display} (${x.front_page_parens})`;

                            if (x.front_page_footnote !== null) {
                                let stars = '';
                                for (let i = 0; i < artist_footnotes.length + 1; i++)
                                    stars += "*";

                                artist_footnotes.push(stars + x.front_page_footnote);
                                display += stars;
                            }

                            return display;
                        });

                        compilation.emitAsset("/index.html", new RawSource(
                            nunjucks.render(path.resolve(__dirname, 'templates/index.html'), {
                                subcats: subcats_for_page,
                                artists: all_artists,
                                artist_footnotes,
                            })
                        ));
                    }

                    // Recurse, and generate site map data
                    for (let subcat of subcats) {
                        let child = {
                            desc: subcat.desc,
                            icon_url: subcat.icon_url,
                            children: [],
                        };

                        let subcat_url = new_url_path_components.slice(0);
                        subcat_url.push(subcat.url_path);
                        subcat_url = subcat_url.join('/');
                        if (subcat.cw !== null)
                            child.url_path = `${subcat_url}/warning.html`;
                        else
                            child.url_path = `${subcat_url}/`;

                        make_category_page(subcat.id, child.children, new_url_path_components);

                        if (child.children.length === 0)
                            delete child.children;
                        children_out.push(child);
                    }
                }
                let root_tree = [];
                make_category_page(0, root_tree);

                // Generate site map page
                compilation.emitAsset("/map.html", new RawSource(
                    nunjucks.render(path.resolve(__dirname, 'templates/map.html'), {
                        sitemap_data: root_tree,
                    })
                ));

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
                all_syms.sort(sorting.sort_syms);

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

                compilation.emitAsset("/list.html", new RawSource(
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
