
import load_csv from './load_csv_web.js';
import { make_databases } from './database.js';
import { get_flattened_categories } from './editor/category_tree.js';

let database;

let main_status;

window.onload = async () => {
    main_status = document.getElementById('main_status');

    const sqlite3 = await window.sqlite3InitModule();
    database = await make_databases(sqlite3, load_csv);

    // Get a list of all categories, so that we can show _where_ a symbol is found
    let category_list = get_flattened_categories(database);
    let category_text_map = new Map();
    for (let cat of category_list) {
        if (!category_text_map.has(cat.id))
            category_text_map.set(cat.id, cat.desc_path);
    }
    console.log(category_text_map);

    // Loading complete!
    main_status.innerText = "AACIL search";
};

window.addEventListener('error', (e) => {
    console.log(e);
    alert(`Error: something broke!\n\nCheck the browser console for more details.\n\n${e.message}`)
});
window.addEventListener('unhandledrejection', (e) => {
    console.log(e);
    alert(`Error: something broke!\n\nCheck the browser console for more details.\n\n${e.reason}`)
});
