import { parse as csv_parse } from 'csv-parse/browser/esm/sync';
import { Snowflake } from "@theinternetfolks/snowflake";
import { export_databases } from '../database.js';
import * as sorting from '../sorting.js';

let csv_map;
let use_discord_bot_mode;

let global_files;
let file_names;
let selected_index;
let img_elems;

let bulk_alt_text;

// TODO FIXME this code is duplicated
export function bulk_sym_setup(database, new_category_choice) {
    let bulk_caption = document.getElementById('bulk_caption');
    bulk_alt_text = document.getElementById('bulk_alt_text');

    // Load all the existing CW information
    let all_cws = [];
    database.exec(`select * from page_cw`, {
        rowMode: 'object',
        resultRows: all_cws,
    });
    all_cws.sort(sorting.sort_sym_cw);

    // Make list of CWs
    let new_cw_select = document.createElement('select');
    new_cw_select.id = 'bulk_on_page_cw'
    // Add an empty option
    new_cw_select.appendChild(document.createElement('option'));

    for (let cw of all_cws) {
        let option = document.createElement('option');
        option.value = cw.id;
        option.innerText = cw.text;
        new_cw_select.appendChild(option);
    }

    document.getElementById('bulk_on_page_cw').replaceWith(new_cw_select);

    // Load all the existing artists
    let all_artists = [];
    database.exec(`select * from artists`, {
        rowMode: 'object',
        resultRows: all_artists,
    });
    all_artists.sort(sorting.sort_artists);

    // Make list of artists (twice)
    let new_artists_select = document.createElement('select');
    new_artists_select.id = 'bulk_artists'
    new_artists_select.multiple = true;
    let new_artists_adapted = document.createElement('select');
    new_artists_adapted.id = 'bulk_adapted_from'
    new_artists_adapted.multiple = true;
    // Add an empty option
    new_artists_adapted.appendChild(document.createElement('option'));

    for (let artist of all_artists) {
        let option = document.createElement('option');
        option.value = artist.id;
        option.innerText = artist.display;
        new_artists_select.appendChild(option);

        option = document.createElement('option');
        option.value = artist.id;
        option.innerText = artist.display;
        new_artists_adapted.appendChild(option);
    }

    document.getElementById('bulk_artists').replaceWith(new_artists_select);
    document.getElementById('bulk_adapted_from').replaceWith(new_artists_adapted);

    document.getElementById('bulk_next').addEventListener('click', async () => {
        if (global_files === undefined || selected_index >= global_files.length)
            return;

        let new_caption = bulk_caption.value;
        if (!new_caption) {
            bulk_caption.focus();
            return;
        }

        let new_alt_text = bulk_alt_text.value;
        if (!new_alt_text) {
            bulk_alt_text.focus();
            return;
        }

        let new_cw = new_cw_select.value;
        if (new_cw)
            new_cw = BigInt(new_cw);
        else
            new_cw = null;

        let new_artists = new Set();
        for (let option of new_artists_select.selectedOptions) {
            if (option.value)
                new_artists.add(BigInt(option.value));
        }
        if (new_artists.size === 0) {
            new_artists_select.focus();
            return;
        }

        let new_adapted_from = new Set();
        for (let option of new_artists_adapted.selectedOptions) {
            if (option.value)
                new_adapted_from.add(BigInt(option.value));
        }

        let new_cat_id = BigInt(new_category_choice.value);

        let new_id = Snowflake.generate();
        let urlified_name = new_caption.replace(/[^0-9a-zA-Z ]/g, '').trim() + ` ${new_id}.png`;

        database.transaction((txn) => {
            // Create the image
            txn.exec(`insert into images(id, filename, caption, alt_text, cw_id) values (?, ?, ?, ?, ?)`, {
                bind: [
                    new_id,
                    '/imgs/' + urlified_name,
                    new_caption,
                    new_alt_text,
                    new_cw,
                ],
            });
            // Put the artist credits
            for (let artist of new_artists) {
                txn.exec(`insert into sym_artists(img_id, artist_id) values (?, ?)`, {
                    bind: [new_id, artist]
                });
            }
            for (let artist of new_adapted_from) {
                txn.exec(`insert into sym_derived_from(img_id, artist_id) values (?, ?)`, {
                    bind: [new_id, artist]
                });
            }
            // Insert it into the chosen category
            txn.exec(`insert into cat_syms(cat_id, img_id) values (?, ?)`, {
                bind: [new_cat_id, new_id]
            });
        });

        file_names.push(urlified_name);
        img_elems[selected_index].dataset.selected = true;
        selected_index++;

        if (use_discord_bot_mode && selected_index !== global_files.length) {
            bulk_alt_text.value = csv_map.get(global_files[selected_index].name);
        }

        if (selected_index === global_files.length) {
            let zip_file = await export_databases(database, false);

            let imgs_folder = zip_file.folder('imgs');
            for (let i = 0; i < global_files.length; i++) {
                imgs_folder.file(file_names[i], global_files[i], { binary: true });
            }

            let zip_blob = await zip_file.generateAsync({ type: 'blob' });

            // Download the blob now
            let url = window.URL.createObjectURL(zip_blob);

            // Create a new invisible link, click on it, and then clean up
            let a = document.createElement('a');
            a.style = "display: none";
            a.href = url;
            a.download = "AACIL Database (bulk).zip";

            document.body.appendChild(a);
            a.click();

            window.URL.revokeObjectURL(url);
            a.remove();

            // Reset state
            let bulk_list = document.getElementById('bulk_list');
            bulk_list.innerHTML = '';
            global_files = undefined;
            file_names = [];
            selected_index = 0;
            img_elems = [];
        }
    })
}

export async function bulk_preview_images(files) {
    let bulk_list = document.getElementById('bulk_list');
    bulk_list.innerHTML = '';

    use_discord_bot_mode = false;

    global_files = [];
    file_names = [];
    selected_index = 0;
    img_elems = [];

    let first_file = undefined;
    for (let file of files) {
        if (file.name === "messages.csv") {
            console.log("Hi R~!");
            use_discord_bot_mode = true;

            let csv_parsed = csv_parse(await file.text(), {
                columns: false,
            });

            csv_map = new Map();
            for (let ent of csv_parsed) {
                csv_map.set(`${ent[0]}.png`, ent[1]);
            }
            console.log(csv_map);

            continue;
        }

        global_files.push(file);

        let img_elem = document.createElement("img");
        img_elem.src = URL.createObjectURL(file);
        bulk_list.appendChild(img_elem);
        img_elems.push(img_elem);

        if (first_file === undefined) {
            first_file = file;
        }
    }

    if (use_discord_bot_mode && first_file !== undefined) {
        bulk_alt_text.value = csv_map.get(first_file.name);
    }
}
