import { Snowflake } from "@theinternetfolks/snowflake";
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
    let cat_delete = document.getElementById('cat_delete');

    // let cat_dup_button = document.getElementById('cat_dup_button');
    //     let sym_dup_button = document.getElementById('sym_dup_button');

    let new_suppress_cw_select;
    let this_cat_info;

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
        let this_cat_info_arr = [];
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
            resultRows: this_cat_info_arr,
        });
        this_cat_info = this_cat_info_arr[0];
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
            cat_delete.remove();
            cat_new.after(cat_delete);
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
            cat_delete.remove();
            dummy_element_parking_lot.appendChild(cat_delete);
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
    }

    // The buttons to actually do things
    function perform_input_validation() {
        let new_desc = cat_desc.value;
        if (!new_desc) {
            cat_desc.focus();
            cat_status.className = "status_error";
            cat_status.innerText = "Must have a description";
            return;
        }

        let new_url = cat_url.value;
        if (!new_url) {
            cat_url.focus();
            cat_status.className = "status_error";
            cat_status.innerText = "Must have a URL";
            return;
        }

        let new_icon_id = null;
        if (cat_icon_id.value) {
            try {
                new_icon_id = BigInt(cat_icon_id.value);
            } catch (e) {
                cat_icon_id.focus();
                cat_status.className = "status_error";
                cat_status.innerText = "Icon ID must be a number or nothing";
                return;
            }
        }

        let new_cw = null;
        if (cat_cw.value)
            new_cw = cat_cw.value;

        let new_show_icons = cat_show_icons.checked;

        let new_suppress_cw = new Set();
        for (let option of new_suppress_cw_select.selectedOptions) {
            if (option.value)
                new_suppress_cw.add(BigInt(option.value));
        }

        let ret = {
            desc: new_desc,
            url: new_url,
            icon_id: new_icon_id,
            cw: new_cw,
            cw_suppressions: new_suppress_cw,
            show_icons: new_show_icons,
        };

        return ret;
    }

    cat_change.onclick = () => {
        // Cannot change the root
        if (cat_id === 0) {
            cat_status.className = "status_error";
            cat_status.innerText = "Cannot modify root category";
            return;
        }

        let changed_cat = perform_input_validation();
        if (changed_cat === undefined) return;
        console.log(changed_cat);

        database.transaction((txn) => {
            // Delete old CW suppressions
            txn.exec(`delete from cw_suppressions where cat_id = ?`, {
                bind: [cat_id],
            });
            // Update the category
            txn.exec(`update categories set
                    desc = ?,
                    url_path = ?,
                    icon_id = ?,
                    cw = ?,
                    have_subcat_icons = ?
                    where id = ?`, {
                bind: [
                    changed_cat.desc,
                    changed_cat.url,
                    changed_cat.icon_id,
                    changed_cat.cw,
                    changed_cat.show_icons,
                    cat_id,
                ],
            });
            // Put the CW suppressions back
            for (let cw of changed_cat.cw_suppressions) {
                txn.exec(`insert into cw_suppressions(cat_id, cw_id) values (?, ?)`, {
                    bind: [cat_id, cw]
                });
            }
        });

        // Ok! If we didn't change the name, we don't have to rebuild the _whole_ UI
        if (this_cat_info.desc === changed_cat.desc)
            reset_ui();
        else
            remake_ui_for_categories_ui();

        cat_status.className = "status_ok";
        cat_status.innerText = "OK!";
        download_changes_elem.style.visibility = '';
    };
    cat_new.onclick = () => {
        let new_cat = perform_input_validation(false);
        if (new_cat === undefined) return;

        let new_id = Snowflake.generate();

        database.transaction((txn) => {
            // Create the category
            txn.exec(`insert into categories(id, desc, url_path, icon_id, cw, have_subcat_icons) values (?, ?, ?, ?, ?, ?)`, {
                bind: [
                    new_id,
                    new_cat.desc,
                    new_cat.url,
                    new_cat.icon_id,
                    new_cat.cw,
                    new_cat.show_icons,
                ],
            });
            // Put the CW suppressions
            for (let cw of new_cat.cw_suppressions) {
                txn.exec(`insert into cw_suppressions(cat_id, cw_id) values (?, ?)`, {
                    bind: [cat_id, cw]
                });
            }
            // Insert it as a subcategory of the current category
            // (Root cannot actually have symbols show up)
            txn.exec(`insert into subcategories(parent_id, child_id) values (?, ?)`, {
                bind: [cat_id, new_id]
            });
        });

        // Ok
        remake_ui_for_categories_ui();

        cat_status.className = "status_ok";
        cat_status.innerText = `OK, new id ${new_id}!`;
        download_changes_elem.style.visibility = '';
    };
    cat_delete.onclick = () => {
        // Cannot delete the root
        if (cat_id === 0) return;

        delete_category(parent_cat_id, cat_id, this_cat_info.num_parents);

        // Ok
        remake_ui_for_categories_ui();

        cat_status.className = "status_ok";
        cat_status.innerText = "OK!";
        download_changes_elem.style.visibility = '';
    }

    // When rearranging categories, we need to prevent infinite loops
    // Since the structure is _already_ acyclic, we can use DFS to check
    // if the edge we are proposing to add will create a cycle or not
    function check_for_loops(start_cat_id, bad_cat_id, ignore_edge) {
        // Check for a trivial loop
        if (start_cat_id == bad_cat_id) return true;

        let subcategories = [];
        database.exec(`select child_id from subcategories where parent_id = ?`, {
            bind: [start_cat_id],
            resultRows: subcategories,
        });

        for (let subcat of subcategories) {
            subcat = subcat[0];

            // When moving, we ignore the will-be-deleted edge
            if (ignore_edge) {
                if (ignore_edge[0] == start_cat_id && ignore_edge[1] == subcat) {
                    continue;
                }
            }

            // Otherwise check and recurse
            if (subcat == bad_cat_id)
                return true;

            if (check_for_loops(subcat, bad_cat_id, ignore_edge))
                return true;
        }

        return false;
    }

    cat_dup_button.onclick = () => {
        let link_target = BigInt(document.getElementById('category_move_select').value);

        // If the target can reach us already, then linking back to it would create a loop
        if (check_for_loops(link_target, cat_id)) {
            cat_status.className = "status_error";
            cat_status.innerText = `Not allowed, would create a loop`;
            return;
        }

        // No loop --> add the link
        database.exec(`insert into subcategories(parent_id, child_id) values (?, ?)`, {
            bind: [cat_id, link_target]
        });

        // Ok
        remake_ui_for_categories_ui();

        cat_status.className = "status_ok";
        cat_status.innerText = `OK! New link added.`;
        download_changes_elem.style.visibility = '';
    }

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
