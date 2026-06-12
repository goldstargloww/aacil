import { Snowflake } from "@theinternetfolks/snowflake";
import * as sorting from '../sorting.js';

export async function load_artist_info(database, download_changes_elem) {
    let dummy_element_parking_lot = document.getElementById('dummy_element_parking_lot');

    let artists_cur_id = document.getElementById('artists_cur_id');
    let artists_status = document.getElementById('artists_status');
    let artist_display = document.getElementById('artist_display');
    let artist_parens = document.getElementById('artist_parens');
    let artist_footnote = document.getElementById('artist_footnote');
    let artist_change = document.getElementById('artist_change');
    let artist_new = document.getElementById('artist_new');

    let artists_merge_victim_id = document.getElementById('artists_merge_victim_id');
    let artist_merge_details = document.getElementById('artist_merge_details');
    let artist_merge_button = document.getElementById('artist_merge_button');

    let new_artists_select;
    let new_artists_merge_select;

    function reset_ui() {
        // Load all the existing artists
        let all_artists = [];
        database.exec(`select * from artists`, {
            rowMode: 'object',
            resultRows: all_artists,
        });
        all_artists.sort(sorting.sort_artists);

        // Reset all the relevant UI
        artists_status.innerHTML = '&nbsp;';
        artists_cur_id.innerHTML = '&nbsp;';
        artist_display.value = '';
        artist_parens.value = '';
        artist_footnote.value = '';
        artist_display.focus();
        // Temporarily remove this, so that we can programmatically change the default button
        artist_change.remove();
        dummy_element_parking_lot.appendChild(artist_change);
        artist_merge_details.style.display = 'none';

        // Make entirely new list of artists
        new_artists_select = document.createElement('select');
        new_artists_select.id = 'artists_select'
        // Add an empty option
        new_artists_select.appendChild(document.createElement('option'));

        new_artists_merge_select = document.createElement('select');
        new_artists_merge_select.id = 'artists_merge_select'

        let all_artists_map = new Map();
        for (let artist of all_artists) {
            let option = document.createElement('option');
            option.value = artist.id;
            option.innerText = artist.display;
            new_artists_select.appendChild(option);

            option = document.createElement('option');
            option.value = artist.id;
            option.innerText = artist.display;
            new_artists_merge_select.appendChild(option);

            all_artists_map.set(artist.id, artist);
        }

        new_artists_select.addEventListener('change', () => {
            let selected_artist_id = new_artists_select.value;
            if (selected_artist_id) {
                artists_cur_id.innerText = `Selected artist ID: ${selected_artist_id}`;
                selected_artist_id = BigInt(selected_artist_id);

                let artist = all_artists_map.get(selected_artist_id);
                artist_display.value = artist.display;
                artist_parens.value = artist.front_page_parens;
                artist_footnote.value = artist.front_page_footnote;

                artist_change.remove();
                artist_new.parentNode.insertBefore(artist_change, artist_new);
                artist_merge_details.style.display = '';
            } else {
                artists_cur_id.innerHTML = '&nbsp;';
                artist_display.value = '';
                artist_parens.value = '';
                artist_footnote.value = '';

                artist_change.remove();
                dummy_element_parking_lot.appendChild(artist_change);
                artist_merge_details.style.display = 'none';
            }
        });

        new_artists_merge_select.addEventListener('change', () => {
            let selected_artist_id = new_artists_merge_select.value;
            if (selected_artist_id) {
                artists_merge_victim_id.innerText = `Selected artist ID: ${selected_artist_id}`;
            } else {
                artists_merge_victim_id.innerHTML = '&nbsp;';
            }
        });

        document.getElementById('artists_select').replaceWith(new_artists_select);
        document.getElementById('artists_merge_select').replaceWith(new_artists_merge_select);
    }

    // The buttons to actually do things
    function perform_input_validation(read_id) {
        let new_display = artist_display.value;
        let new_parens = artist_parens.value;
        let new_footnote = artist_footnote.value;

        if (!new_display) {
            artist_display.focus();
            artists_status.className = "status_error";
            artists_status.innerText = "Must have a name";
            return;
        }

        if (!new_parens) {
            new_parens = null;
        }
        if (!new_footnote) {
            new_footnote = null;
        }

        let query_data = [new_display, new_footnote, new_parens];
        if (read_id) {
            query_data.push(BigInt(new_artists_select.value));
        }
        return {
            query_insert_args: "(display, front_page_footnote, front_page_parens, id)",
            query_update_args: "display = ?, front_page_footnote = ?, front_page_parens = ?",
            query_data,
        };
    }

    artist_change.onclick = () => {
        let changed_artist = perform_input_validation(true);
        if (changed_artist === undefined) return;

        let { query_update_args, query_data } = changed_artist;
        database.exec(`update artists set ${query_update_args} where id = ?`, {
            bind: query_data
        });

        // Ok
        reset_ui();

        artists_status.className = "status_ok";
        artists_status.innerText = "OK!";
        download_changes_elem.style.visibility = '';
    };
    artist_new.onclick = () => {
        let new_artist = perform_input_validation(false);
        if (new_artist === undefined) return;

        let { query_insert_args, query_data } = new_artist;

        let new_id = Snowflake.generate();
        query_data.push(new_id);

        let query_values = []
        for (let i = 0; i < query_data.length; i++)
            query_values.push('?');
        query_values = query_values.join(', ');

        database.exec(`insert into artists ${query_insert_args} values (${query_values})`, {
            bind: query_data
        });

        // Ok
        reset_ui();

        artists_status.className = "status_ok";
        artists_status.innerText = `OK, new id ${new_id}!`;
        download_changes_elem.style.visibility = '';
    };

    artist_merge_button.onclick = () => {
        let artist_merge_into = new_artists_select.value;
        if (!artist_merge_into) {
            artists_status.className = "status_error";
            artists_status.innerText = "No artist selected to merge into";
            return;
        }
        artist_merge_into = BigInt(artist_merge_into);

        let artist_merge_victim = artists_merge_select.value;
        if (!artist_merge_victim) {
            artists_status.className = "status_error";
            artists_status.innerText = "No artist selected to merge into";
            return;
        }
        artist_merge_victim = BigInt(artist_merge_victim);

        if (artist_merge_into == artist_merge_victim) {
            artists_status.className = "status_error";
            artists_status.innerText = "Selected the same artists";
            return;
        }

        database.transaction((txn) => {
            txn.exec(`update sym_artists set artist_id = ? where artist_id = ?`, {
                bind: [artist_merge_into, artist_merge_victim],
            });
            txn.exec(`update sym_derived_from set artist_id = ? where artist_id = ?`, {
                bind: [artist_merge_into, artist_merge_victim],
            });
            txn.exec(`delete from artists where id = ?`, {
                bind: [artist_merge_victim]
            });
        });

        // Ok
        reset_ui();

        artists_status.className = "status_ok";
        artists_status.innerText = "OK!";
        download_changes_elem.style.visibility = '';
    }

    // Set up the UI the first time
    reset_ui();
}
