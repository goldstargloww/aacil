import load_csv from './load_csv_web.js';
import { make_databases, export_databases } from './database.js';

window.onload = async () => {
    const sqlite3 = await window.sqlite3InitModule();

    console.log("This is the editor WIP!");

    const database = await make_databases(sqlite3, load_csv);
    await export_databases(database);
};
