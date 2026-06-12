
import load_csv from './load_csv_web.js';
import { make_databases } from './database.js';
import { get_flattened_categories } from './editor/category_tree.js';
import { lookup_artist_credits } from './artist_credit.js';
import * as sorting from './sorting.js';

let database;

let main_status;

window.onload = async () => {
    main_status = document.getElementById('main_status');
    search_query = document.getElementById('search_query');
    search_advanced = document.getElementById('search_advanced');
    search_caption = document.getElementById('search_caption');
    search_alt_text = document.getElementById('search_alt_text');
    search_button = document.getElementById('search_button');
    search_results_summary = document.getElementById('search_results_summary');
    selected_sym_information = document.getElementById('selected_sym_information');
    search_results = document.getElementById('search_results');

    const sqlite3 = await window.sqlite3InitModule();
    database = await make_databases(sqlite3, load_csv);

    // Set up FTS (full text search)
    database.exec(`create virtual table fts using fts5(caption, alt_text, tokenize = "unicode61 remove_diacritics 2")`);
    // Because we can have _alternate_ labels, we need this complicated query
    database.exec(`insert into fts(rowid, caption, alt_text)
        select id as rowid, group_concat(caption, ' ') as caption, alt_text from (
            select id, caption, alt_text from images
            union select id, cat_syms.override_caption as caption, images.alt_text
                from cat_syms join images on cat_syms.img_id = images.id
                where cat_syms.override_caption not null
        ) group by id`);

    // Get a list of all categories, so that we can show _where_ a symbol is found
    let category_list = get_flattened_categories(database);
    let category_text_map = new Map();
    for (let cat of category_list) {
        if (!category_text_map.has(cat.id))
            category_text_map.set(cat.id, cat.desc_path);
    }
    console.log(category_text_map);

    // Set up the list of artists
    let all_artists = [];
    database.exec(`select * from artists`, {
        rowMode: 'object',
        resultRows: all_artists,
    });
    all_artists.sort(sorting.sort_artists);

    let new_artists_select = document.createElement('select');
    new_artists_select.id = 'search_artist'
    // Add an empty option
    let empty_artist = document.createElement('option');
    empty_artist.innerText = "< any artist >";
    empty_artist.value = '';
    new_artists_select.appendChild(empty_artist);

    for (let artist of all_artists) {
        let option = document.createElement('option');
        option.value = artist.id;
        option.innerText = artist.display;
        new_artists_select.appendChild(option);
    }

    document.getElementById('search_artist').replaceWith(new_artists_select);

    search_button.addEventListener('click', () => {
        let query = search_query.value;
        if (!query) {
            search_query.focus();
            search_results_summary.innerText = "Please enter something to search for.";
            return;
        }

        let use_fts = search_advanced.checked;
        let use_captions = search_caption.checked;
        let use_alt = search_alt_text.checked;

        let artist = new_artists_select.value;
        console.log(artist);
        if (!artist)
            artist = null;
        else
            artist = BigInt(artist);

        let sql;
        if (use_fts) {
            sql = `select * from images `;
            if (use_captions || use_alt) {
                sql += `where `;
            }
            if (use_captions) {
                sql += `id in (select rowid from fts where caption match $query)`
                if (use_alt) {
                    sql += ` or `
                }
            }
            if (use_alt) {
                sql += `id in (select rowid from fts where alt_text match $query)`
            }
        } else {
            query = `%${query}%`;

            sql = `select * from images `;
            if (use_captions || use_alt) {
                sql += `where `;
            }
            if (use_captions) {
                sql += `caption like $query`
                if (use_alt) {
                    sql += ` or `
                }
            }
            if (use_alt) {
                sql += `alt_text like $query`
            }
        }

        let query_obj = { $query: query };
        if (artist !== null) {
            sql = `select intermed.* from (${sql}) as intermed
                join sym_artists on intermed.id = sym_artists.img_id
                where sym_artists.artist_id=$artist`;
            query_obj.$artist = artist;
        }

        console.log(query_obj, sql);

        // Look up all the symbols that belong on this page
        let syms = [];
        database.exec(sql, {
            bind: query_obj,
            rowMode: 'object',
            resultRows: syms,
        });

        // Look up the artist credits for symbols
        for (let sym of syms) {
            sym.credit = lookup_artist_credits(database, sym.id);
        }

        // Sort symbols
        syms.sort(sorting.sort_syms);

        // Generate output

        console.log(syms);
        search_results_summary.innerText = `Found ${syms.length} results.`
        search_results.innerHTML = '';

        for (let sym of syms) {
            let figure = document.createElement('figure');
            figure.dataset.id = sym.id;

            let imgcontain = document.createElement('div');
            imgcontain.className = 'imgcontain';
            let img = document.createElement('img');
            img.src = sym.filename;
            img.alt = sym.alt_text;
            imgcontain.appendChild(img);
            figure.appendChild(imgcontain);

            let figcaption = document.createElement('figcaption');

            let caption_span = document.createElement('span');
            caption_span.className = 'caption';
            caption_span.innerText = sym.caption;
            figcaption.appendChild(caption_span);

            let credit_span = document.createElement('span');
            credit_span.className = 'credit';
            credit_span.innerText = ` | By ${sym.credit}.`;
            figcaption.appendChild(credit_span);

            figure.appendChild(figcaption);

            search_results.appendChild(figure);
        }
    });

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
