import { Snowflake } from "@theinternetfolks/snowflake";
import load_csv from './load_csv_web.js';
import { make_databases, export_databases } from './database.js';
import * as sorting from './sorting.js';
import { load_syms } from "./editor/symbols.js";
import { load_artist_info } from "./editor/artists.js";
import { load_sym_cw_info } from "./editor/symbol_cws.js";

let database;

let main_status;
let download_changes_elem;

let with_cat_tree;
let symbols_ui;
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
    with_cat_tree.style.display = 'none';
    symbols_ui.style.display = 'none';
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

// Returns: {
//      $children: [...]
//      $parent: <instance>
//      ...other DB data
// }
// Useful for displaying a tree of categories.
function get_category_tree(node_id) {
    // Ask the database for this node's information
    let node_info = [];
    database.exec(`select * from categories where id = ?`, {
        bind: [node_id],
        rowMode: 'object',
        resultRows: node_info,
    });

    // Ask the database for children (subcategories)
    let children = [];
    database.exec(`select child_id from subcategories where parent_id = ?`, {
        bind: [node_id],
        resultRows: children,
    });

    let node = {
        $children: [],
        $parent: null,
        ...node_info[0],
    };

    node.$children = children.map((x) => {
        let child_node_id = x[0];
        let child_node_obj = get_category_tree(child_node_id);
        child_node_obj.$parent = node;
        return child_node_obj;
    });
    node.$children.sort(sorting.sort_categories);

    return node;
}

// Flatten category tree into a list, "preorder traversal"
// Yields a list of {
//      id: BigInt,
//      desc_path: string,
//      url_path: string,
// }
// Used specifically to allow *choosing* a category
function flatten_category_tree(cat_tree) {
    let flattened = [];
    function flatten_recurse(node, desc_path, url_path) {
        // Don't emit the root, otherwise emit self
        if (node.id !== 0) {
            desc_path.push(node.desc);
            url_path.push(node.url_path);
            flattened.push({
                id: node.id,
                desc_path: desc_path.join(" > "),
                url_path: '/' + url_path.join("/") + '/',
            });
        }

        for (let child of node.$children) {
            let desc_path_new = desc_path.slice(0);
            let url_path_new = url_path.slice(0);
            flatten_recurse(child, desc_path_new, url_path_new);
        }
    }
    flatten_recurse(cat_tree, [], []);
    return flattened;
}

function make_cat_tree_ui(cat_tree, cb) {
    let new_cat_tree = document.createElement('ol');
    new_cat_tree.id = 'cat_tree';

    function make_recurse(node) {
        let li = document.createElement('li');
        let li_div = document.createElement('div');
        li.appendChild(li_div);
        let li_span = document.createElement('span');
        li_div.appendChild(li_span);
        li_span.innerText = node.desc;
        li.addEventListener('click', async (e) => {
            // Clear all the existing selections
            for (let e of new_cat_tree.querySelectorAll('[data-selected]')) {
                delete e.dataset.selected;
            }

            li.dataset.selected = true;
            await cb(node.id);
            e.stopPropagation();
        });

        if (node.$children.length > 0) {
            let ol_child = document.createElement('ol');
            for (let child of node.$children) {
                ol_child.appendChild(make_recurse(child));
            }
            li.appendChild(ol_child);
        }

        return li;
    }

    let li = make_recurse(cat_tree);
    new_cat_tree.appendChild(li);

    let old_cat_tree = document.getElementById('cat_tree');
    old_cat_tree.parentNode.replaceChild(new_cat_tree, old_cat_tree);

    with_cat_tree.style.display = '';
}

window.onload = async () => {
    main_status = document.getElementById('main_status');
    download_changes_elem = document.getElementById('download_changes');
    with_cat_tree = document.getElementById('with_cat_tree');
    symbols_ui = document.getElementById('symbols_ui');
    artists_ui = document.getElementById('artists_ui');
    sym_cw_ui = document.getElementById('sym_cw_ui');

    download_changes_elem.addEventListener('click', download_changes_fn);

    const sqlite3 = await window.sqlite3InitModule();
    database = await make_databases(sqlite3, load_csv);

    // Load information about categories out of DB into memory
    let category_tree = get_category_tree(0);
    let category_list = flatten_category_tree(category_tree);

    on_select_tab('tab_symbols', symbols_ui, async () => {
        make_cat_tree_ui(category_tree, async (cat_id) => {
            await load_syms(database, download_changes_elem, cat_id);
        });
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
