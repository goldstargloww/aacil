import { Snowflake } from "@theinternetfolks/snowflake";
import load_csv from './load_csv_web.js';
import { make_databases, export_databases } from './database.js';
import { remake_category_ui, make_category_dropdown } from "./editor/category_tree.js";
import { load_syms } from "./editor/symbols.js";
import { load_cat_edit } from "./editor/category_edit.js";
import { load_artist_info } from "./editor/artists.js";
import { load_sym_cw_info } from "./editor/symbol_cws.js";
import { bulk_sym_setup, bulk_preview_images } from "./editor/bulk_symbols.js";

let database;

let main_status;
let download_changes_elem;

let symbols_ui;
let cats_ui;
let bulk_add_ui;
let artists_ui;
let sym_cw_ui;
let devtools_ui;

let bulk_category_label;
let bulk_drop;

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
    bulk_add_ui.style.display = 'none';
    artists_ui.style.display = 'none';
    sym_cw_ui.style.display = 'none';
    devtools_ui.style.display = 'none';
    bulk_category_label.removeAttribute('for');
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
    bulk_add_ui = document.getElementById('bulk_add_ui');
    artists_ui = document.getElementById('artists_ui');
    sym_cw_ui = document.getElementById('sym_cw_ui');
    devtools_ui = document.getElementById('devtools_ui');
    bulk_category_label = document.getElementById('bulk_category_label');
    bulk_drop = document.getElementById('bulk_drop');

    download_changes_elem.addEventListener('click', download_changes_fn);

    const sqlite3 = await window.sqlite3InitModule();
    database = await make_databases(sqlite3, load_csv);
    // This hack allows developers to run arbitrary JS from the browser console to do bulk operations
    window.__database = database;

    on_select_tab('tab_symbols', symbols_ui, async () => {
        let category_text_map = new Map();

        let { category_list, category_move_select } = remake_category_ui(
            database,
            async (cat_id) => {
                await load_syms(database, download_changes_elem, category_text_map, cat_id);
            }
        );

        for (let cat of category_list) {
            if (!category_text_map.has(cat.id))
                category_text_map.set(cat.id, cat.desc_path);
        }

        category_move_select.remove();
        document.getElementById('sym_move_label').after(category_move_select);

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

            category_move_select.remove();
            document.getElementById('cat_move_label').after(category_move_select);

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
    on_select_tab('tab_bulk_add', bulk_add_ui, async () => {
        let new_category_choice = make_category_dropdown(database, false);
        new_category_choice.remove();
        bulk_category_label.after(new_category_choice);
        bulk_category_label.setAttribute('for', new_category_choice.id);

        bulk_sym_setup(database, new_category_choice);
    });
    on_select_tab('tab_artists', artists_ui, load_artist_info);
    on_select_tab('tab_cws', sym_cw_ui, load_sym_cw_info);
    on_select_tab('tab_devtools', devtools_ui, async () => {
        let dev_sql = document.getElementById('dev_sql');
        let dev_sql_table = document.getElementById('dev_sql_table');
        let dev_sql_run = document.getElementById('dev_sql_run');
        let dev_snowflake = document.getElementById('dev_snowflake');
        let dev_snowflake_find = document.getElementById('dev_snowflake_find');
        let dev_snowflake_output = document.getElementById('dev_snowflake_output');
        dev_sql_table.innerHTML = '';
        dev_snowflake_output.innerText = '';

        dev_sql_run.addEventListener('click', () => {
            let sql = dev_sql.value;

            dev_sql_table.innerHTML = '';
            let thead;
            let tbody = document.createElement('tbody');

            database.exec(sql, {
                callback: (row, stmt) => {
                    if (!thead) {
                        thead = document.createElement('thead');
                        let tr = document.createElement('tr');
                        for (let ent of stmt.getColumnNames()) {
                            let th = document.createElement('th');
                            th.innerText = ent;
                            tr.appendChild(th);
                        }
                        thead.appendChild(tr);
                    }
                    let tr = document.createElement('tr');
                    for (let ent of row) {
                        let td = document.createElement('td');
                        td.innerText = ent;
                        tr.appendChild(td);
                    }
                    tbody.appendChild(tr);
                },
            });

            if (thead)
                dev_sql_table.appendChild(thead);
            dev_sql_table.appendChild(tbody);

            download_changes_elem.style.visibility = '';
        });

        dev_snowflake_find.addEventListener('click', () => {
            let id = dev_snowflake.value;
            if (!id) return;
            id = BigInt(id);

            let textout = '';

            let rows = [];
            database.exec(`select text from page_cw where id=?`, {
                bind: [id],
                resultRows: rows,
            });
            for (let res of rows) {
                textout += `Is a symbol CW, "${res[0]}"\n`;
            }

            rows = [];
            database.exec(`select caption, filename from images where id=?`, {
                bind: [id],
                resultRows: rows,
            });
            for (let res of rows) {
                textout += `Is a symbol, "${res[0]}" (${res[1]})\n`;
            }

            rows = [];
            database.exec(`select display from artists where id=?`, {
                bind: [id],
                resultRows: rows,
            });
            for (let res of rows) {
                textout += `Is an artist, "${res[0]}"`;
            }

            rows = [];
            database.exec(`select desc from categories where id=?`, {
                bind: [id],
                resultRows: rows,
            });
            for (let res of rows) {
                textout += `Is a category, "${res[0]}"`;
            }

            dev_snowflake_output.innerText = textout;
        });
    });

    // Drag-and-drop logic
    bulk_drop.addEventListener("dragover", (e) => {
        const fileItems = [...e.dataTransfer.items].filter(
            (item) => item.kind === "file",
        );
        if (fileItems.length > 0) {
            e.preventDefault();
            e.dataTransfer.dropEffect = "copy";
        }
    });

    bulk_drop.addEventListener('drop', (ev) => {
        ev.preventDefault();
        const files = [...ev.dataTransfer.items]
            .map((item) => item.getAsFile())
            .filter((file) => file);
        bulk_preview_images(files);
    })

    // File selector
    document.getElementById('bulk_file').addEventListener("change", (e) => {
        bulk_preview_images(e.target.files);
    });

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

// Logic needed for file drag-and-drop
window.addEventListener("drop", (e) => {
    if ([...e.dataTransfer.items].some((item) => item.kind === "file")) {
        e.preventDefault();
    }
});

window.addEventListener("dragover", (e) => {
    const fileItems = [...e.dataTransfer.items].filter(
        (item) => item.kind === "file",
    );
    if (fileItems.length > 0) {
        e.preventDefault();
        if (!bulk_drop.contains(e.target)) {
            e.dataTransfer.dropEffect = "none";
        }
    }
});
