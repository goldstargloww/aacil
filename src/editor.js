import load_csv from './load_csv_web.js';
import { make_databases, export_databases } from './database.js';

window.onload = async () => {
    const sqlite3 = await window.sqlite3InitModule();

    console.log("This is the editor WIP!");

    const database = await make_databases(sqlite3, load_csv);
    let zip_blob = await export_databases(database);
    let url = window.URL.createObjectURL(zip_blob);
    window.location.assign(url);
};
