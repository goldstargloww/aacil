import * as sorting from '../sorting.js';

export async function load_cat_edit(
    database,
    download_changes_elem,
    remake_ui_for_categories_ui,
    cat_id, parent_cat_id) {

    console.log(cat_id, parent_cat_id, remake_ui_for_categories_ui);
    //     let dummy_element_parking_lot = document.getElementById('dummy_element_parking_lot');

    //     let sym_cur_id = document.getElementById('sym_cur_id');
    //     let sym_status = document.getElementById('sym_status');
    //     let one_sym_actions = document.getElementById('one_sym_actions');
    //     let sym_url = document.getElementById('sym_url');
    //     let sym_caption = document.getElementById('sym_caption');
    //     let sym_alt_text = document.getElementById('sym_alt_text');
    //     let sym_also_found = document.getElementById('sym_also_found');
    //     let sym_change = document.getElementById('sym_change');
    //     let sym_new = document.getElementById('sym_new');
    //     let sym_delete = document.getElementById('sym_delete');

    //     let sym_move_button = document.getElementById('sym_move_button');
    //     let sym_dup_button = document.getElementById('sym_dup_button');

    //     let new_sym_list;

    //     let new_sym_cw_select;
    //     let new_artists_select;
    //     let new_artists_adapted;

    function reset_ui() {
        //         let all_syms_map = new Map();

        // Load all the existing CW information
        let all_cws = [];
        database.exec(`select * from page_cw`, {
            rowMode: 'object',
            resultRows: all_cws,
        });
        all_cws.sort(sorting.sort_sym_cw);

        // Load information about this category
        let this_cat_info = [];
        database.exec(`
            select *, count(cat_syms.img_id) as num_symbols
            from categories left join cat_syms on categories.id = cat_syms.cat_id
            where categories.id = ?
            group by cat_syms.cat_id`, {
            bind: [cat_id],
            rowMode: 'object',
            resultRows: this_cat_info,
        });
        this_cat_info = this_cat_info[0];
        console.log(this_cat_info);

        // Load the subcategories linked from here
        let subcategories = [];
        database.exec(`
            select categories.id, categories.desc
            from subcategories join categories on subcategories.child_id = categories.id
            where subcategories.parent_id = ?`, {
            bind: [cat_id],
            rowMode: 'object',
            resultRows: subcategories,
        });
        subcategories.sort(sorting.sort_categories);
        console.log(subcategories);

        // Load information about CW suppressions
        let cw_suppressions = [];
        database.exec(`select cw_id from cw_suppressions where cat_id = ?`, {
            bind: [cat_id],
            resultRows: cw_suppressions,
        });
        cw_suppressions = cw_suppressions.map((x) => x[0]);
        console.log(cw_suppressions);

        //         // Make list of CWs
        //         new_sym_cw_select = document.createElement('select');
        //         new_sym_cw_select.id = 'sym_on_page_cw'
        //         // Add an empty option
        //         new_sym_cw_select.appendChild(document.createElement('option'));

        //         for (let cw of all_cws) {
        //             let option = document.createElement('option');
        //             option.value = cw.id;
        //             option.innerText = cw.text;
        //             new_sym_cw_select.appendChild(option);
        //         }

        //         document.getElementById('sym_on_page_cw').replaceWith(new_sym_cw_select);

        //         // Load all the existing artists
        //         let all_artists = [];
        //         database.exec(`select * from artists`, {
        //             rowMode: 'object',
        //             resultRows: all_artists,
        //         });
        //         all_artists.sort(sorting.sort_artists);

        //         // Make list of artists (twice)
        //         new_artists_select = document.createElement('select');
        //         new_artists_select.id = 'sym_artists'
        //         new_artists_select.multiple = true;
        //         new_artists_adapted = document.createElement('select');
        //         new_artists_adapted.id = 'sym_adapted_from'
        //         new_artists_adapted.multiple = true;
        //         // Add an empty option
        //         new_artists_adapted.appendChild(document.createElement('option'));

        //         for (let artist of all_artists) {
        //             let option = document.createElement('option');
        //             option.value = artist.id;
        //             option.innerText = artist.display;
        //             new_artists_select.appendChild(option);

        //             option = document.createElement('option');
        //             option.value = artist.id;
        //             option.innerText = artist.display;
        //             new_artists_adapted.appendChild(option);

        //         }

        //         document.getElementById('sym_artists').replaceWith(new_artists_select);
        //         document.getElementById('sym_adapted_from').replaceWith(new_artists_adapted);

        //         // Load all the existing symbols
        //         let all_syms = [];
        //         if (cat_id === 0) {
        //             database.exec(`select *, null as override_caption from images`, {
        //                 rowMode: 'object',
        //                 resultRows: all_syms,
        //             });
        //         } else {
        //             database.exec(`
        //                 select images.*, cat_syms.override_caption
        //                     from images join cat_syms on images.id = cat_syms.img_id
        //                     where cat_syms.cat_id = ?`, {
        //                 bind: [cat_id],
        //                 rowMode: 'object',
        //                 resultRows: all_syms,
        //             });
        //         }
        //         for (let sym of all_syms) {
        //             if (sym.override_caption !== null) {
        //                 sym.orig_caption = sym.caption;
        //                 sym.caption = sym.override_caption;
        //             } else {
        //                 sym.orig_caption = sym.caption;
        //             }
        //         }
        //         all_syms.sort(sorting.sort_syms);

        //         // Reset all the relevant UI
        //         sym_status.innerHTML = '&nbsp;';
        //         sym_cur_id.innerHTML = '&nbsp;';
        //         sym_url.value = '';
        //         sym_caption.value = '';
        //         sym_alt_text.value = '';
        //         // Temporarily remove this, so that we can programmatically change the default button
        //         sym_change.remove();
        //         dummy_element_parking_lot.appendChild(sym_change);

        //         // Make entirely new list of CWs
        //         new_sym_list = document.createElement('div');
        //         new_sym_list.id = 'sym_list'

        //         let last_selected_i = 0;
        //         let last_selected_was_already_marked = false;
        //         sym_delete.disabled = true;

        //         function update_sym_form() {
        //             let selected_syms = Array.from(new_sym_list.querySelectorAll('[data-selected]'));
        //             selected_syms = selected_syms.map((x) => all_syms_map.get(BigInt(x.dataset.id)));

        //             let selected_sym_str = selected_syms.map((x) => x.id).join(', ');
        //             sym_cur_id.innerText = `Selected symbol ID(s): ${selected_sym_str}`;

        //             sym_delete.disabled = selected_syms.length === 0;

        //             if (selected_syms.length > 1) {
        //                 one_sym_actions.style.display = 'none';
        //             } else {
        //                 if (selected_syms.length === 1) {
        //                     sym_url.value = selected_syms[0].filename;
        //                     sym_caption.value = selected_syms[0].caption;
        //                     sym_alt_text.value = selected_syms[0].alt_text;
        //                     new_sym_cw_select.value = selected_syms[0].cw_id;

        //                     // Look up where _else_ this symbol is used
        //                     let used_elsewhere_cats = []
        //                     database.exec(`
        //                         select cat_id, override_caption from cat_syms
        //                         where img_id = ? and cat_id != ?`, {
        //                         bind: [selected_syms[0].id, cat_id],
        //                         rowMode: 'object',
        //                         resultRows: used_elsewhere_cats,
        //                     });
        //                     if (used_elsewhere_cats.length > 0) {
        //                         let new_also_found = document.createElement('ul');
        //                         new_also_found.id = sym_also_found.id;

        //                         for (let used_elsewhere of used_elsewhere_cats) {
        //                             let li = document.createElement('li');

        //                             let alt_caption = used_elsewhere.override_caption;
        //                             if (alt_caption === null)
        //                                 alt_caption = selected_syms[0].orig_caption;
        //                             li.innerText = `${category_text_map.get(used_elsewhere.cat_id)} as ${alt_caption}`;

        //                             new_also_found.appendChild(li);
        //                         }

        //                         sym_also_found.replaceWith(new_also_found);
        //                         sym_also_found = new_also_found;
        //                     } else {
        //                         let new_also_found = document.createElement('div');
        //                         new_also_found.id = sym_also_found.id;
        //                         new_also_found.innerText = "< none, only here >";
        //                         sym_also_found.replaceWith(new_also_found);
        //                         sym_also_found = new_also_found;
        //                     }

        //                     // Look up all artists (and adapted from) for this symbol
        //                     new_artists_select.selectedIndex = -1;
        //                     let sym_artists = [];
        //                     database.exec(`select artist_id from sym_artists where img_id = ?`, {
        //                         bind: [selected_syms[0].id],
        //                         resultRows: sym_artists,
        //                     });
        //                     let sym_artists_set = new Set();
        //                     for (let artist of sym_artists) {
        //                         sym_artists_set.add(artist[0]);
        //                     }
        //                     for (let option of new_artists_select.options) {
        //                         if (sym_artists_set.has(BigInt(option.value))) {
        //                             option.selected = true;
        //                         }
        //                     }

        //                     new_artists_adapted.selectedIndex = -1;
        //                     let sym_derived_from = [];
        //                     database.exec(`select artist_id from sym_derived_from where img_id = ?`, {
        //                         bind: [selected_syms[0].id],
        //                         resultRows: sym_derived_from,
        //                     });
        //                     let sym_derived_from_set = new Set();
        //                     for (let artist of sym_derived_from) {
        //                         sym_derived_from_set.add(artist[0]);
        //                     }
        //                     for (let option of new_artists_adapted.options) {
        //                         if (sym_derived_from_set.has(BigInt(option.value))) {
        //                             option.selected = true;
        //                         }
        //                     }

        //                     sym_change.remove();
        //                     sym_new.parentNode.insertBefore(sym_change, sym_new);
        //                 } else {
        //                     sym_url.value = '';
        //                     sym_caption.value = '';
        //                     sym_alt_text.value = '';
        //                     new_sym_cw_select.value = '';
        //                     new_artists_select.selectedIndex = -1;
        //                     new_artists_adapted.selectedIndex = -1;

        //                     sym_change.remove();
        //                     dummy_element_parking_lot.appendChild(sym_change);
        //                 }

        //                 one_sym_actions.style.display = '';
        //             }
        //         }

        //         new_sym_list.addEventListener('click', () => {
        //             // Clicked on a blank spot
        //             for (let elem of new_sym_list.querySelectorAll('[data-selected]')) {
        //                 delete elem.dataset.selected;
        //             }

        //             last_selected_i = 0;
        //             last_selected_was_already_marked = false;
        //             update_sym_form();
        //         });

        //         let all_figures = [];
        //         for (let [sym_i, sym] of all_syms.entries()) {
        //             let figure = document.createElement('figure');
        //             figure.dataset.id = sym.id;
        //             all_figures.push(figure);

        //             let imgcontain = document.createElement('div');
        //             imgcontain.className = 'imgcontain';
        //             if (cat_id !== 0) {
        //                 let img = document.createElement('img');
        //                 img.src = sym.filename;
        //                 img.alt = sym.alt_text;
        //                 imgcontain.appendChild(img);
        //             } else {
        //                 // Loading all the 10k+ images on a page will make it lag too much, so don't
        //                 imgcontain.innerText = sym.filename;
        //             }
        //             figure.appendChild(imgcontain);

        //             let figcaption = document.createElement('figcaption');
        //             figcaption.innerText = sym.caption;
        //             figure.appendChild(figcaption);

        //             new_sym_list.appendChild(figure);

        //             all_syms_map.set(sym.id, sym);

        //             figure.addEventListener('click', (e) => {
        //                 // macOS does something weird in the browser
        //                 let ctrl = (e.metaKey || e.ctrlKey);
        //                 let shift = e.shiftKey;

        //                 // If the control key isn't held, clear all existing selections
        //                 if (!ctrl) {
        //                     for (let elem of new_sym_list.querySelectorAll('[data-selected]')) {
        //                         delete elem.dataset.selected;
        //                     }
        //                 }
        //                 if (shift) {
        //                     // If the control key isn't held but shift is,
        //                     // (de)select everything between the last click and this
        //                     let sym_i_a = sym_i;
        //                     let sym_i_b = last_selected_i;
        //                     if (sym_i_a > sym_i_b) {
        //                         sym_i_a = last_selected_i;
        //                         sym_i_b = sym_i;
        //                     };
        //                     for (let i = sym_i_a; i <= sym_i_b; i++) {
        //                         if (!last_selected_was_already_marked)
        //                             all_figures[i].dataset.selected = true;
        //                         else
        //                             delete all_figures[i].dataset.selected;
        //                     }
        //                 } else {
        //                     // Control click or normal click, toggle the clicked element
        //                     if (figure.dataset.selected) {
        //                         delete figure.dataset.selected;
        //                         last_selected_was_already_marked = true;
        //                     } else {
        //                         figure.dataset.selected = true;
        //                         last_selected_was_already_marked = false;
        //                     }
        //                     last_selected_i = sym_i;
        //                 }

        //                 e.stopPropagation();

        //                 update_sym_form();
        //             });
        //         }

        //         document.getElementById('sym_list').replaceWith(new_sym_list);
        //     }

        //     // The buttons to actually do things
        //     function perform_input_validation(read_id) {
        //         let new_url = sym_url.value;
        //         if (!new_url) {
        //             sym_url.focus();
        //             sym_status.className = "status_error";
        //             sym_status.innerText = "Must have a URL";
        //             return;
        //         }

        //         let new_caption = sym_caption.value;
        //         if (!new_caption) {
        //             sym_caption.focus();
        //             sym_status.className = "status_error";
        //             sym_status.innerText = "Must have a caption";
        //             return;
        //         }

        //         let new_alt_text = sym_alt_text.value;
        //         if (!new_alt_text) {
        //             sym_alt_text.focus();
        //             sym_status.className = "status_error";
        //             sym_status.innerText = "Must have alt text";
        //             return;
        //         }

        //         let new_cw = new_sym_cw_select.value;
        //         if (new_cw)
        //             new_cw = BigInt(new_cw);
        //         else
        //             new_cw = null;

        //         let new_artists = new Set();
        //         for (let option of new_artists_select.selectedOptions) {
        //             if (option.value)
        //                 new_artists.add(BigInt(option.value));
        //         }
        //         if (new_artists.size === 0) {
        //             new_artists_select.focus();
        //             sym_status.className = "status_error";
        //             sym_status.innerText = "Please select an artist";
        //             return;
        //         }

        //         let new_adapted_from = new Set();
        //         for (let option of new_artists_adapted.selectedOptions) {
        //             if (option.value)
        //                 new_adapted_from.add(BigInt(option.value));
        //         }

        //         let ret = {
        //             url: new_url,
        //             caption: new_caption,
        //             alt_text: new_alt_text,
        //             cw: new_cw,
        //             artists: new_artists,
        //             adapted_from: new_adapted_from,
        //         };

        //         if (read_id) {
        //             let selected_syms = Array.from(new_sym_list.querySelectorAll('[data-selected]'));
        //             selected_syms = selected_syms.map((x) => BigInt(x.dataset.id));

        //             if (selected_syms.length !== 1) {
        //                 sym_status.className = "status_error";
        //                 sym_status.innerText = "Please select a symbol to change";
        //                 return;
        //             }

        //             ret.id = selected_syms[0];
        //         }

        //         return ret;
    }

    //     sym_change.onclick = () => {
    //         let changed_sym = perform_input_validation(true);
    //         if (changed_sym === undefined) return;

    //         // How many places is this used?
    //         let num_uses = [];
    //         database.exec(`select count(*) from cat_syms where img_id = ?`, {
    //             bind: [changed_sym.id],
    //             resultRows: num_uses,
    //         });
    //         num_uses = num_uses[0][0];

    //         database.transaction((txn) => {
    //             // Delete old artist credits
    //             txn.exec(`delete from sym_artists where img_id = ?`, {
    //                 bind: [changed_sym.id],
    //             });
    //             txn.exec(`delete from sym_derived_from where img_id = ?`, {
    //                 bind: [changed_sym.id],
    //             });

    //             // Figure out _where_ to put the caption
    //             let use_override_caption = false;
    //             if (num_uses <= 1) {
    //                 // If this is only used in one place, do not use override.
    //                 // Also make sure there aren't any lingering overrides either
    //                 txn.exec(`update cat_syms set override_caption = null where cat_id = ? and img_id = ?`, {
    //                     bind: [cat_id, changed_sym.id],
    //                 });
    //             } else if (cat_id !== 0) {
    //                 // If we are editing from the root, always update the "true" caption

    //                 // Otherwise, this is used in two or more places, so use local override
    //                 use_override_caption = true;
    //             }

    //             // Update the image
    //             if (!use_override_caption) {
    //                 txn.exec(`update images set
    //                     filename = ?,
    //                     caption = ?,
    //                     alt_text = ?,
    //                     cw_id = ?
    //                     where id = ?`, {
    //                     bind: [
    //                         changed_sym.url,
    //                         changed_sym.caption,
    //                         changed_sym.alt_text,
    //                         changed_sym.cw,
    //                         changed_sym.id
    //                     ],
    //                 });
    //             } else {
    //                 txn.exec(`update cat_syms set override_caption = ? where cat_id = ? and img_id = ?`, {
    //                     bind: [changed_sym.caption, cat_id, changed_sym.id],
    //                 });
    //                 txn.exec(`update images set
    //                     filename = ?,
    //                     alt_text = ?,
    //                     cw_id = ?
    //                     where id = ?`, {
    //                     bind: [
    //                         changed_sym.url,
    //                         changed_sym.alt_text,
    //                         changed_sym.cw,
    //                         changed_sym.id
    //                     ],
    //                 });
    //             }
    //             // Put the artist credits back
    //             for (let artist of changed_sym.artists) {
    //                 txn.exec(`insert into sym_artists(img_id, artist_id) values (?, ?)`, {
    //                     bind: [changed_sym.id, artist]
    //                 });
    //             }
    //             for (let artist of changed_sym.adapted_from) {
    //                 txn.exec(`insert into sym_derived_from(img_id, artist_id) values (?, ?)`, {
    //                     bind: [changed_sym.id, artist]
    //                 });
    //             }
    //         });

    //         // Ok
    //         reset_ui();

    //         sym_status.className = "status_ok";
    //         sym_status.innerText = "OK!";
    //         download_changes_elem.style.visibility = '';
    //     };
    //     sym_new.onclick = () => {
    //         let new_sym = perform_input_validation(false);
    //         if (new_sym === undefined) return;

    //         let new_id = Snowflake.generate();

    //         database.transaction((txn) => {
    //             // Create the image
    //             txn.exec(`insert into images(id, filename, caption, alt_text, cw_id) values (?, ?, ?, ?, ?)`, {
    //                 bind: [
    //                     new_id,
    //                     new_sym.url,
    //                     new_sym.caption,
    //                     new_sym.alt_text,
    //                     new_sym.cw,
    //                 ],
    //             });
    //             // Put the artist credits
    //             for (let artist of new_sym.artists) {
    //                 txn.exec(`insert into sym_artists(img_id, artist_id) values (?, ?)`, {
    //                     bind: [new_id, artist]
    //                 });
    //             }
    //             for (let artist of new_sym.adapted_from) {
    //                 txn.exec(`insert into sym_derived_from(img_id, artist_id) values (?, ?)`, {
    //                     bind: [new_id, artist]
    //                 });
    //             }
    //             if (cat_id !== 0) {
    //                 // Insert it into the current category
    //                 // (Root cannot actually have symbols show up)
    //                 txn.exec(`insert into cat_syms(cat_id, img_id) values (?, ?)`, {
    //                     bind: [cat_id, new_id]
    //                 });
    //             }
    //         });

    //         // Ok
    //         reset_ui();

    //         sym_status.className = "status_ok";
    //         sym_status.innerText = `OK, new id ${new_id}!`;
    //         download_changes_elem.style.visibility = '';
    //     };
    //     sym_delete.onclick = () => {
    //         let selected_syms = new_sym_list.querySelectorAll('[data-selected]');

    //         for (let sym of selected_syms) {
    //             let sym_id = BigInt(sym.dataset.id);

    //             // How many places is this used?
    //             let num_uses = [];
    //             database.exec(`select count(*) from cat_syms where img_id = ?`, {
    //                 bind: [sym_id],
    //                 resultRows: num_uses,
    //             });

    //             if (num_uses[0][0] > 1) {
    //                 // If the symbol is used in multiple places, only delete *this* copy
    //                 database.exec(`delete from cat_syms where cat_id = ? and img_id = ?`, {
    //                     bind: [cat_id, sym_id],
    //                 });
    //             } else {
    //                 // Otherwise delete *everything*
    //                 database.transaction((txn) => {
    //                     // Delete artist credits
    //                     txn.exec(`delete from sym_artists where img_id = ?`, {
    //                         bind: [sym_id],
    //                     });
    //                     txn.exec(`delete from sym_derived_from where img_id = ?`, {
    //                         bind: [sym_id],
    //                     });
    //                     // Delete the references
    //                     txn.exec(`delete from cat_syms where img_id = ?`, {
    //                         bind: [sym_id],
    //                     });
    //                     // Delete the image
    //                     txn.exec(`delete from images where id = ?`, {
    //                         bind: [sym_id],
    //                     });
    //                 });
    //             }
    //         }

    //         // Ok
    //         reset_ui();

    //         sym_status.className = "status_ok";
    //         sym_status.innerText = "OK!";
    //         download_changes_elem.style.visibility = '';
    //     }

    //     sym_move_button.onclick = () => {
    //         let to_cat = BigInt(document.getElementById('category_move_select').value);
    //         if (!to_cat) {
    //             sym_status.className = "status_error";
    //             sym_status.innerText = "No category selected";
    //             return;
    //         }

    //         let selected_syms = Array.from(new_sym_list.querySelectorAll('[data-selected]'));
    //         selected_syms = selected_syms.map((x) => BigInt(x.dataset.id));

    //         for (let sym_id of selected_syms) {
    //             database.transaction((txn) => {
    //                 txn.exec(`delete from cat_syms where cat_id = ? and img_id = ?`, {
    //                     bind: [cat_id, sym_id]
    //                 });
    //                 txn.exec(`insert into cat_syms(cat_id, img_id) values (?, ?)`, {
    //                     bind: [to_cat, sym_id]
    //                 });
    //             });
    //         }

    //         // Ok
    //         reset_ui();

    //         sym_status.className = "status_ok";
    //         sym_status.innerText = `OK! Moved ${selected_syms.length} items.`;
    //         download_changes_elem.style.visibility = '';
    //     }

    //     sym_dup_button.onclick = () => {
    //         let to_cat = BigInt(document.getElementById('category_move_select').value);
    //         if (!to_cat) {
    //             sym_status.className = "status_error";
    //             sym_status.innerText = "No category selected";
    //             return;
    //         }

    //         let selected_syms = Array.from(new_sym_list.querySelectorAll('[data-selected]'));
    //         selected_syms = selected_syms.map((x) => BigInt(x.dataset.id));

    //         for (let sym_id of selected_syms) {
    //             database.transaction((txn) => {
    //                 txn.exec(`insert into cat_syms(cat_id, img_id) values (?, ?)`, {
    //                     bind: [to_cat, sym_id]
    //                 });
    //             });
    //         }

    //         // Ok
    //         reset_ui();

    //         sym_status.className = "status_ok";
    //         sym_status.innerText = `OK! Made copies of ${selected_syms.length} items.`;
    //         download_changes_elem.style.visibility = '';
    //     }

    // Set up the UI the first time
    reset_ui();
}
