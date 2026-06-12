import * as sorting from '../sorting.js';

export async function load_cat_edit(
    database,
    download_changes_elem,
    remake_ui_for_categories_ui,
    cat_id, parent_cat_id) {

    let dummy_element_parking_lot = document.getElementById('dummy_element_parking_lot');

    let cat_status = document.getElementById('cat_status');
    let cat_cur_id = document.getElementById('cat_cur_id');
    let cat_icon = document.getElementById('cat_icon');
    let cat_subcats = document.getElementById('cat_subcats');
    let cat_desc = document.getElementById('cat_desc');
    let cat_url = document.getElementById('cat_url');
    let cat_icon_id = document.getElementById('cat_icon_id');
    let cat_cw = document.getElementById('cat_cw');
    let cat_show_icons = document.getElementById('cat_show_icons');
    let cat_change = document.getElementById('cat_change');
    let cat_new = document.getElementById('cat_new');
    //     let sym_delete = document.getElementById('sym_delete');

    //     let sym_move_button = document.getElementById('sym_move_button');
    //     let sym_dup_button = document.getElementById('sym_dup_button');

    let new_suppress_cw_select;

    function delete_category(parent_id, this_id, num_parents) {
        if (num_parents > 1) {
            // This exists in multiple places, so sever only a single link
            database.exec(`delete from subcategories where parent_id = ? and child_id = ?`, {
                bind: [parent_id, this_id],
            });
        } else {
            // This is the only reference to the category, so we're _really_ deleting it
            database.transaction((txn) => {
                // Move any of our subcategories to the root
                txn.exec(`update or ignore subcategories set parent_id = 0 where parent_id = ?`, {
                    bind: [this_id],
                });
                // Remove us from subcategory lists
                txn.exec(`delete from subcategories where child_id = ?`, {
                    bind: [this_id],
                });
                // Delete symbols and suppressions
                txn.exec(`delete from cw_suppressions where cat_id = ?`, {
                    bind: [this_id],
                });
                txn.exec(`delete from cat_syms where cat_id = ?`, {
                    bind: [this_id],
                });
                // Finally delete self
                txn.exec(`delete from categories where id = ?`, {
                    bind: [this_id],
                });
            });
        }
    }

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
            select categories.*,
                count(cat_syms.img_id) as num_symbols,
                count(distinct subcategories.parent_id) as num_parents,
                images.filename as icon_url, images.alt_text as icon_alt
            from categories
                left join subcategories on subcategories.child_id = categories.id
                left join images on images.id = categories.icon_id
                left join cat_syms on categories.id = cat_syms.cat_id
            where categories.id = ?
            group by categories.id`, {
            bind: [cat_id],
            rowMode: 'object',
            resultRows: this_cat_info,
        });
        this_cat_info = this_cat_info[0];
        console.log(this_cat_info);

        // Load the subcategories linked from here
        let subcategories = [];
        database.exec(`
            select categories.id, categories.desc,
                count(subcat2.parent_id) as num_parents
            from subcategories
                join categories on subcategories.child_id = categories.id
                left join subcategories as subcat2 on subcategories.child_id = subcat2.child_id
            where subcategories.parent_id = ?
            group by subcat2.child_id`, {
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
        let cw_suppressions_set = new Set();
        for (let cw of cw_suppressions) {
            cw_suppressions_set.add(cw[0]);
        }
        console.log(cw_suppressions_set);

        // Make list of CWs
        new_suppress_cw_select = document.createElement('select');
        new_suppress_cw_select.id = 'cat_suppress_cw';
        new_suppress_cw_select.multiple = true;
        // Add an empty option
        new_suppress_cw_select.appendChild(document.createElement('option'));

        for (let cw of all_cws) {
            let option = document.createElement('option');
            option.value = cw.id;
            option.innerText = cw.text;
            new_suppress_cw_select.appendChild(option);
        }

        document.getElementById('cat_suppress_cw').replaceWith(new_suppress_cw_select);

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

        // Reset all the relevant UI
        cat_status.innerHTML = '&nbsp;';

        cat_cur_id.innerHTML = `Selected category ID: ${this_cat_info.id} (with ${this_cat_info.num_symbols} symbols)`;
        if (this_cat_info.icon_id !== null) {
            cat_icon.src = this_cat_info.icon_url;
            cat_icon.alt = this_cat_info.icon_alt;
        } else {
            // This is a blank image
            cat_icon.src = 'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';
            cat_icon.alt = '';
        }
        if (cat_id !== 0) {
            cat_desc.value = this_cat_info.desc;
            cat_url.value = this_cat_info.url_path;
            cat_icon_id.value = this_cat_info.icon_id;
            cat_cw.value = this_cat_info.cw;
            cat_show_icons.checked = this_cat_info.have_subcat_icons;

            // CW suppressions
            new_suppress_cw_select.selectedIndex = -1;
            for (let option of new_suppress_cw_select.options) {
                if (cw_suppressions_set.has(BigInt(option.value))) {
                    option.selected = true;
                }
            }

            cat_change.remove();
            cat_new.parentNode.insertBefore(cat_change, cat_new);
        } else {
            // Root properties cannot be changed
            cat_desc.value = '';
            cat_url.value = '';
            cat_icon_id.value = '';
            cat_cw.value = '';
            cat_show_icons.checked = false;
            new_suppress_cw_select.selectedIndex = -1;

            cat_change.remove();
            dummy_element_parking_lot.appendChild(cat_change);
        }

        // Make entirely new list of subcategories
        let new_subcat_list = document.createElement('ol');
        new_subcat_list.id = 'cat_subcats'

        for (let subcat of subcategories) {
            let li = document.createElement('li');

            let span = document.createElement('span');
            span.innerText = subcat.desc;
            li.appendChild(span);

            let button = document.createElement('button');
            button.innerText = "Delete this subcategory";
            li.appendChild(button);
            button.addEventListener('click', () => {
                delete_category(cat_id, subcat.id, subcat.num_parents);
                remake_ui_for_categories_ui();
                cat_status.className = "status_ok";
                cat_status.innerText = `OK! Deleted ${subcat.desc}`;
                download_changes_elem.style.visibility = '';
            });

            new_subcat_list.appendChild(li);
        }

        document.getElementById('cat_subcats').replaceWith(new_subcat_list);


        //         let last_selected_i = 0;
        //         let last_selected_was_already_marked = false;
        //         sym_delete.disabled = true;

        //         function update_sym_form() {
        //             let selected_syms = Array.from(new_subcat_list.querySelectorAll('[data-selected]'));
        //             selected_syms = selected_syms.map((x) => all_syms_map.get(BigInt(x.dataset.id)));

        //             let selected_sym_str = selected_syms.map((x) => x.id).join(', ');
        //             cat_cur_id.innerText = `Selected symbol ID(s): ${selected_sym_str}`;

        //             sym_delete.disabled = selected_syms.length === 0;

        //             if (selected_syms.length > 1) {
        //                 one_sym_actions.style.display = 'none';
        //             } else {
        //                 if (selected_syms.length === 1) {
        //                     cat_url.value = selected_syms[0].filename;
        //                     cat_desc.value = selected_syms[0].caption;
        //                     sym_alt_text.value = selected_syms[0].alt_text;
        //                     new_suppress_cw_select.value = selected_syms[0].cw_id;

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



        //                 } else {
        //                 }

        //                 one_sym_actions.style.display = '';
        //             }
        //         }

        //         new_subcat_list.addEventListener('click', () => {
        //             // Clicked on a blank spot
        //             for (let elem of new_subcat_list.querySelectorAll('[data-selected]')) {
        //                 delete elem.dataset.selected;
        //             }

        //             last_selected_i = 0;
        //             last_selected_was_already_marked = false;
        //             update_sym_form();
        //         });

        //         let all_figures = [];
        //         for (let [sym_i, sym] of all_syms.entries()) {

        //             all_syms_map.set(sym.id, sym);

        //             figure.addEventListener('click', (e) => {
        //                 // macOS does something weird in the browser
        //                 let ctrl = (e.metaKey || e.ctrlKey);
        //                 let shift = e.shiftKey;

        //                 // If the control key isn't held, clear all existing selections
        //                 if (!ctrl) {
        //                     for (let elem of new_subcat_list.querySelectorAll('[data-selected]')) {
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

        //         document.getElementById('sym_list').replaceWith(new_subcat_list);
        //     }

        //     // The buttons to actually do things
        //     function perform_input_validation(read_id) {
        //         let new_url = cat_url.value;
        //         if (!new_url) {
        //             cat_url.focus();
        //             cat_status.className = "status_error";
        //             cat_status.innerText = "Must have a URL";
        //             return;
        //         }

        //         let new_caption = cat_desc.value;
        //         if (!new_caption) {
        //             cat_desc.focus();
        //             cat_status.className = "status_error";
        //             cat_status.innerText = "Must have a caption";
        //             return;
        //         }

        //         let new_alt_text = sym_alt_text.value;
        //         if (!new_alt_text) {
        //             sym_alt_text.focus();
        //             cat_status.className = "status_error";
        //             cat_status.innerText = "Must have alt text";
        //             return;
        //         }

        //         let new_cw = new_suppress_cw_select.value;
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
        //             cat_status.className = "status_error";
        //             cat_status.innerText = "Please select an artist";
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
        //             let selected_syms = Array.from(new_subcat_list.querySelectorAll('[data-selected]'));
        //             selected_syms = selected_syms.map((x) => BigInt(x.dataset.id));

        //             if (selected_syms.length !== 1) {
        //                 cat_status.className = "status_error";
        //                 cat_status.innerText = "Please select a symbol to change";
        //                 return;
        //             }

        //             ret.id = selected_syms[0];
        //         }

        //         return ret;
    }

    //     cat_change.onclick = () => {
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

    //         cat_status.className = "status_ok";
    //         cat_status.innerText = "OK!";
    //         download_changes_elem.style.visibility = '';
    //     };
    //     cat_new.onclick = () => {
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

    //         cat_status.className = "status_ok";
    //         cat_status.innerText = `OK, new id ${new_id}!`;
    //         download_changes_elem.style.visibility = '';
    //     };
    //     sym_delete.onclick = () => {
    //         let selected_syms = new_subcat_list.querySelectorAll('[data-selected]');

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

    //         cat_status.className = "status_ok";
    //         cat_status.innerText = "OK!";
    //         download_changes_elem.style.visibility = '';
    //     }

    //     sym_move_button.onclick = () => {
    //         let to_cat = BigInt(document.getElementById('category_move_select').value);
    //         if (!to_cat) {
    //             cat_status.className = "status_error";
    //             cat_status.innerText = "No category selected";
    //             return;
    //         }

    //         let selected_syms = Array.from(new_subcat_list.querySelectorAll('[data-selected]'));
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

    //         cat_status.className = "status_ok";
    //         cat_status.innerText = `OK! Moved ${selected_syms.length} items.`;
    //         download_changes_elem.style.visibility = '';
    //     }

    //     sym_dup_button.onclick = () => {
    //         let to_cat = BigInt(document.getElementById('category_move_select').value);
    //         if (!to_cat) {
    //             cat_status.className = "status_error";
    //             cat_status.innerText = "No category selected";
    //             return;
    //         }

    //         let selected_syms = Array.from(new_subcat_list.querySelectorAll('[data-selected]'));
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

    //         cat_status.className = "status_ok";
    //         cat_status.innerText = `OK! Made copies of ${selected_syms.length} items.`;
    //         download_changes_elem.style.visibility = '';
    //     }

    // Set up the UI the first time
    reset_ui();
}
