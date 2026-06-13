import * as sorting from '../sorting.js';

let global_files;
let selected_index;
let img_elems;

// TODO FIXME this code is duplicated
export function bulk_sym_setup(database) {
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

    document.getElementById('bulk_next').addEventListener('click', () => {
        if (global_files === undefined || selected_index >= global_files.length)
            return;

        console.log("do file");

        img_elems[selected_index].dataset.selected = true;
        selected_index++;
    })
}

export function bulk_preview_images(files) {
    let bulk_list = document.getElementById('bulk_list');
    bulk_list.innerHTML = '';

    global_files = files;
    selected_index = 0;
    img_elems = [];

    for (let file of files) {
        let img_elem = document.createElement("img");
        img_elem.src = URL.createObjectURL(file);
        bulk_list.appendChild(img_elem);
        img_elems.push(img_elem);
    }
}
