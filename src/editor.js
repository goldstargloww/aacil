import { Snowflake } from "@theinternetfolks/snowflake";
import load_csv from './load_csv_web.js';
import { make_databases, export_databases } from './database.js';
import { remake_category_ui } from "./editor/category_tree.js";
import { load_syms } from "./editor/symbols.js";
import { load_cat_edit } from "./editor/category_edit.js";
import { load_artist_info } from "./editor/artists.js";
import { load_sym_cw_info } from "./editor/symbol_cws.js";

let database;

let main_status;
let download_changes_elem;

let symbols_ui;
let cats_ui;
let artists_ui;
let sym_cw_ui;

async function download_changes_fn() {
    let zip_blob = await export_databases(database);
    let url = window.URL.createObjectURL(zip_blob);

    // Create a new invisible link, click on it, and then clean up
    let a = document.createElement('a');
    a.style = "display: none";
    a.href = url;
    a.download = "AACIL Database.zip";

    document.body.appendChild(a);
    a.click();

    window.URL.revokeObjectURL(url);
    a.remove();
}

function deselect_all_tabs() {
    document.getElementById('with_cat_tree').style.display = 'none';
    symbols_ui.style.display = 'none';
    cats_ui.style.display = 'none';
    artists_ui.style.display = 'none';
    sym_cw_ui.style.display = 'none';
}
function on_select_tab(tab_id, ui_element, cb) {
    let tab_element = document.getElementById(tab_id);
    tab_element.checked = false;
    tab_element.addEventListener('input', async () => {
        deselect_all_tabs();
        await cb(database, download_changes_elem);
        ui_element.style.display = '';
    });
}

window.onload = async () => {
    main_status = document.getElementById('main_status');
    download_changes_elem = document.getElementById('download_changes');
    symbols_ui = document.getElementById('symbols_ui');
    cats_ui = document.getElementById('cats_ui');
    artists_ui = document.getElementById('artists_ui');
    sym_cw_ui = document.getElementById('sym_cw_ui');

    download_changes_elem.addEventListener('click', download_changes_fn);

    const sqlite3 = await window.sqlite3InitModule();
    database = await make_databases(sqlite3, load_csv);

    on_select_tab('tab_symbols', symbols_ui, async () => {
        let category_text_map = new Map();

        let { category_list, category_move_select } = remake_category_ui(
            database,
            async (cat_id) => {
                await load_syms(database, download_changes_elem, category_text_map, cat_id);
            }
        );

        for (let cat of category_list) {
            category_text_map.set(cat.id, cat.desc_path);
        }

        let sym_move_label = document.getElementById('sym_move_label');
        category_move_select.remove();
        sym_move_label.after(category_move_select);

        // Force deselect
        await load_syms(database, download_changes_elem, category_text_map, -1);
    });
    on_select_tab('tab_cats', cats_ui, async () => {
        async function remake_ui_for_categories_ui() {
            let { category_move_select } = remake_category_ui(
                database,
                async (cat_id, from_cat) => {
                    await load_cat_edit(
                        database,
                        download_changes_elem,
                        remake_ui_for_categories_ui,
                        cat_id, from_cat
                    );
                },
                true,
            );

            let cat_move_label = document.getElementById('cat_move_label');
            category_move_select.remove();
            cat_move_label.after(category_move_select);

            // Force load the root category on startup
            await load_cat_edit(
                database,
                download_changes_elem,
                remake_ui_for_categories_ui,
                0, null
            );
        }
        await remake_ui_for_categories_ui();
    });
    on_select_tab('tab_artists', artists_ui, load_artist_info);
    on_select_tab('tab_cws', sym_cw_ui, load_sym_cw_info);

    // Loading complete!
    main_status.innerText = "What would you like to work on?";
};

window.addEventListener('error', (e) => {
    console.log(e);
    alert(`Error: something broke!\n\nCheck the browser console for more details.\n\n${e.message}`)
});
window.addEventListener('unhandledrejection', (e) => {
    console.log(e);
    alert(`Error: something broke!\n\nCheck the browser console for more details.\n\n${e.reason}`)
});
