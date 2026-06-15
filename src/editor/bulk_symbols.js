import { parse as csv_parse } from 'csv-parse/browser/esm/sync';
import { Snowflake } from "@theinternetfolks/snowflake";
import { export_databases } from '../database.js';
import * as sorting from '../sorting.js';

let global_files;       // list of File objects
let symbol_metadata;    // list of objects containing metadata
let selected_index;
let img_list_elems;     // Actually a list of <div>s

let bulk_caption;
let bulk_alt_text;
let new_cw_select;
let new_artists_select;
let new_artists_adapted;
let category_select;

function load_selected_item_state() {
    if (selected_index >= symbol_metadata.length) return;

    let bulk_cur_img = document.getElementById('bulk_cur_img');
    let img_url = img_list_elems[selected_index].querySelectorAll('img')[0].src;
    bulk_cur_img.innerHTML = '';
    let one_img = document.createElement('img');
    one_img.src = img_url;
    bulk_cur_img.appendChild(one_img);

    let meta = symbol_metadata[selected_index];

    // If there is data here, load it. Otherwise, leave current form untouched.
    // If using Discord mode, some data is preloaded.
    // If not using Discord mode, untouched ==> blank to start
    if (meta.caption)
        bulk_caption.value = meta.caption;
    if (meta.alt_text)
        bulk_alt_text.value = meta.alt_text;

    if (meta.manually_touched) {
        // If manually touched, load all of this state (overwriting the form)
        new_cw_select.value = meta.cw;

        for (let opt of new_artists_select.options) {
            opt.selected = meta.artist.has(BigInt(opt.value));
        }
        for (let opt of new_artists_adapted.options) {
            opt.selected = meta.adapted_from.has(BigInt(opt.value));
        }

        if (meta.category)
            category_select.value = meta.category;
    }
}

// TODO FIXME this code is duplicated
export function bulk_sym_setup(database, new_category_choice) {
    let bulk_list = document.getElementById('bulk_list');
    let bulk_cur_img = document.getElementById('bulk_cur_img');
    bulk_caption = document.getElementById('bulk_caption');
    bulk_alt_text = document.getElementById('bulk_alt_text');
    category_select = new_category_choice;

    // Load all the existing CW information
    let all_cws = [];
    database.exec(`select * from page_cw`, {
        rowMode: 'object',
        resultRows: all_cws,
    });
    all_cws.sort(sorting.sort_sym_cw);

    // Make list of CWs
    new_cw_select = document.createElement('select');
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
    new_artists_select = document.createElement('select');
    new_artists_select.id = 'bulk_artists'
    new_artists_select.multiple = true;
    new_artists_adapted = document.createElement('select');
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

    document.getElementById('bulk_next').onclick = async () => {
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

        // At this point, the data is valid enough to insert,
        // so we store it in the global state.
        symbol_metadata[selected_index].caption = new_caption;
        symbol_metadata[selected_index].alt_text = new_alt_text;
        symbol_metadata[selected_index].cw = new_cw;
        symbol_metadata[selected_index].artist = new_artists;
        symbol_metadata[selected_index].adapted_from = new_adapted_from;
        symbol_metadata[selected_index].category = new_cat_id;
        symbol_metadata[selected_index].manually_touched = true;

        img_list_elems[selected_index].dataset.completed = true;

        // Pick the next item to edit, wrapping around if necessary
        let all_done = true;
        let new_idx;
        for (let i = 0; i < global_files.length; i++) {
            new_idx = (selected_index + 1 + i) % global_files.length;
            if (!symbol_metadata[new_idx].manually_touched) {
                all_done = false;
                break;
            }
        }

        if (!all_done) {
            // Unmark the previous selection and choose this one next
            for (let elem of bulk_list.querySelectorAll('[data-selected]')) {
                delete elem.dataset.selected;
            }
            selected_index = new_idx;
            img_list_elems[selected_index].dataset.selected = true;
            load_selected_item_state();
        } else {
            // When done, we have to process everything, generate the new DB, etc
            database.transaction((txn) => {
                for (let i = 0; i < global_files.length; i++) {
                    let meta = symbol_metadata[i];

                    let new_id = Snowflake.generate();
                    let urlified_name = meta.caption.replace(/[^0-9a-zA-Z ]/g, '').trim() + ` ${new_id}.png`;
                    meta.urlified_name = urlified_name;

                    let new_cw = null;
                    if (meta.cw)
                        new_cw = BigInt(meta.cw);

                    // Create the image
                    txn.exec(`insert into images(id, filename, caption, alt_text, cw_id) values (?, ?, ?, ?, ?)`, {
                        bind: [
                            new_id,
                            '/imgs/' + urlified_name,
                            meta.caption,
                            meta.alt_text,
                            new_cw,
                        ],
                    });
                    // Put the artist credits
                    for (let artist of meta.artist) {
                        txn.exec(`insert into sym_artists(img_id, artist_id) values (?, ?)`, {
                            bind: [new_id, artist]
                        });
                    }
                    for (let artist of meta.adapted_from) {
                        txn.exec(`insert into sym_derived_from(img_id, artist_id) values (?, ?)`, {
                            bind: [new_id, artist]
                        });
                    }
                    // Insert it into the chosen category
                    txn.exec(`insert into cat_syms(cat_id, img_id) values (?, ?)`, {
                        bind: [meta.category, new_id]
                    });
                }
            });

            // And then also generate a zip file with renamed image files
            let zip_file = await export_databases(database, false);

            let imgs_folder = zip_file.folder('imgs');
            for (let i = 0; i < global_files.length; i++) {
                imgs_folder.file(symbol_metadata[i].urlified_name, global_files[i], { binary: true });
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
            bulk_list.innerHTML = '';
            bulk_cur_img.innerHTML = '';
            global_files = undefined;
            symbol_metadata = [];
            selected_index = 0;
            img_list_elems = [];
        }
    };
}

export async function bulk_preview_images(files) {
    let bulk_list = document.getElementById('bulk_list');
    bulk_list.innerHTML = '';
    document.getElementById('bulk_cur_img').innerHTML = '';

    let csv_map = new Map();
    let use_discord_bot_mode = false;

    global_files = [];
    symbol_metadata = [];
    selected_index = 0;
    img_list_elems = [];

    let first_file = undefined;
    let i = 0;
    for (let file of files) {
        if (file.name === "messages.csv") {
            console.log("Hi R~!");
            use_discord_bot_mode = true;

            let csv_parsed = csv_parse(await file.text(), {
                columns: false,
            });

            for (let ent of csv_parsed) {
                csv_map.set(`${ent[0]}.png`, ent[1]);
            }

            continue;
        }

        global_files.push(file);
        symbol_metadata.push({
            caption: '',
            alt_text: '',
            cw: '',
            artist: new Set(),
            adapted_from: new Set(),
            category: BigInt(0),

            manually_touched: false,
            urlified_name: null,
        })

        let img_elem = document.createElement('img');
        img_elem.src = URL.createObjectURL(file);
        let img_wrap = document.createElement('div');
        img_wrap.appendChild(img_elem);

        // Capture this variable for the closure
        let i_copy = i;
        img_wrap.addEventListener('click', () => {
            selected_index = i_copy;
            for (let elem of bulk_list.querySelectorAll('[data-selected]')) {
                delete elem.dataset.selected;
            }
            img_wrap.dataset.selected = true;

            load_selected_item_state();
        })

        bulk_list.appendChild(img_wrap);
        img_list_elems.push(img_wrap);

        if (first_file === undefined) {
            first_file = file;
            img_wrap.dataset.selected = true;
        }

        i++;
    }

    if (use_discord_bot_mode) {
        for (let [i, file] of global_files.entries()) {
            symbol_metadata[i].alt_text = csv_map.get(file.name);
        }
    }

    load_selected_item_state();
}
