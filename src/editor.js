import { Snowflake } from "@theinternetfolks/snowflake";
import load_csv from './load_csv_web.js';
import { make_databases, export_databases } from './database.js';
import { load_artist_info } from "./editor/artists.js";
import { load_sym_cw_info } from "./editor/symbol_cws.js";

let database;

let main_status;
let download_changes_elem;

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
    artists_ui = document.getElementById('artists_ui');
    sym_cw_ui = document.getElementById('sym_cw_ui');

    download_changes_elem.addEventListener('click', download_changes_fn);

    const sqlite3 = await window.sqlite3InitModule();
    database = await make_databases(sqlite3, load_csv);

    on_select_tab('tab_artists', artists_ui, load_artist_info);
    on_select_tab('tab_cws', sym_cw_ui, load_sym_cw_info);

    // Loading complete!
    main_status.innerText = "What would you like to work on?";
};
