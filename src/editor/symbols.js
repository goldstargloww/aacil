import * as sorting from '../sorting.js';

export async function load_syms(database, download_changes_elem, cat_id) {
    let dummy_element_parking_lot = document.getElementById('dummy_element_parking_lot');

    let symbols_ui = document.getElementById('symbols_ui');
    let sym_cur_id = document.getElementById('sym_cur_id');
    let sym_status = document.getElementById('sym_status');
    let one_sym_actions = document.getElementById('one_sym_actions');
    let sym_url = document.getElementById('sym_url');
    let sym_caption = document.getElementById('sym_caption');
    let sym_alt_text = document.getElementById('sym_alt_text');
    // let sym_cw_change = document.getElementById('sym_cw_change');
    // let sym_cw_new = document.getElementById('sym_cw_new');
    // let sym_cw_delete = document.getElementById('sym_cw_delete');

    let all_syms_map;
    let new_sym_list;

    function reset_ui() {
        console.log(cat_id);
        // Load all the existing symbols
        let all_syms = [];
        if (cat_id === 0) {
            database.exec(`
                select images.*, page_cw.text as cw_text
                    from images left join page_cw on images.cw_id = page_cw.id`, {
                rowMode: 'object',
                resultRows: all_syms,
            });
        } else {
            database.exec(`
                select images.*, page_cw.text as cw_text
                    from images join cat_syms on images.id = cat_syms.img_id
                    left join page_cw on images.cw_id = page_cw.id
                    where cat_syms.cat_id = ?`, {
                bind: [cat_id],
                rowMode: 'object',
                resultRows: all_syms,
            });
        }
        all_syms.sort(sorting.sort_syms);
        console.log(all_syms);

        // Reset all the relevant UI
        sym_status.innerHTML = '&nbsp;';
        sym_cur_id.innerHTML = '&nbsp;';
        sym_url.value = '';
        sym_caption.value = '';
        sym_alt_text.value = '';
        // // Temporarily remove this, so that we can programmatically change the default button
        // sym_cw_change.remove();
        // dummy_element_parking_lot.appendChild(sym_cw_change);
        // sym_cw_delete.style.display = 'none';

        // Make entirely new list of CWs
        new_sym_list = document.createElement('div');
        new_sym_list.id = 'sym_list'

        let last_selected_i = 0;
        let last_selected_was_already_marked = false;

        function update_sym_form() {
            let selected_syms = Array.from(new_sym_list.querySelectorAll('[data-selected]'));
            selected_syms = selected_syms.map((x) => all_syms_map.get(BigInt(x.dataset.id)));
            console.log(selected_syms);

            let selected_sym_str = selected_syms.map((x) => x.id).join(', ');
            sym_cur_id.innerText = `Selected symbol ID(s): ${selected_sym_str}`;

            if (selected_syms.length > 1) {
                one_sym_actions.style.display = 'none';
            } else {
                if (selected_syms.length === 1) {
                    sym_url.value = selected_syms[0].filename;
                    sym_caption.value = selected_syms[0].caption;
                    sym_alt_text.value = selected_syms[0].alt_text;
                } else {
                    sym_url.value = '';
                    sym_caption.value = '';
                    sym_alt_text.value = '';
                }

                one_sym_actions.style.display = '';
            }
        }

        symbols_ui.addEventListener('click', () => {
            // Clicked on a blank spot
            for (let elem of new_sym_list.querySelectorAll('[data-selected]')) {
                delete elem.dataset.selected;
            }

            last_selected_i = 0;
            last_selected_was_already_marked = false;
            update_sym_form();
        });

        all_syms_map = new Map();
        let all_figures = [];
        for (let [sym_i, sym] of all_syms.entries()) {
            let figure = document.createElement('figure');
            figure.dataset.id = sym.id;
            all_figures.push(figure);

            let imgcontain = document.createElement('div');
            imgcontain.className = 'imgcontain';
            let img = document.createElement('img');
            img.src = sym.filename;
            img.alt = sym.alt_text;
            imgcontain.appendChild(img);
            figure.appendChild(imgcontain);

            let figcaption = document.createElement('figcaption');
            figcaption.innerText = sym.caption;
            figure.appendChild(figcaption);

            new_sym_list.appendChild(figure);

            all_syms_map.set(sym.id, sym);

            figure.addEventListener('click', (e) => {
                // macOS does something weird in the browser
                let ctrl = (e.metaKey || e.ctrlKey);
                let shift = e.shiftKey;

                // If the control key isn't held, clear all existing selections
                if (!ctrl) {
                    for (let elem of new_sym_list.querySelectorAll('[data-selected]')) {
                        delete elem.dataset.selected;
                    }
                }
                if (shift) {
                    // If the control key isn't held but shift is,
                    // (de)select everything between the last click and this
                    let sym_i_a = sym_i;
                    let sym_i_b = last_selected_i;
                    if (sym_i_a > sym_i_b) {
                        sym_i_a = last_selected_i;
                        sym_i_b = sym_i;
                    };
                    for (let i = sym_i_a; i <= sym_i_b; i++) {
                        if (!last_selected_was_already_marked)
                            all_figures[i].dataset.selected = true;
                        else
                            delete all_figures[i].dataset.selected;
                    }
                } else {
                    // Control click or normal click, toggle the clicked element
                    if (figure.dataset.selected) {
                        delete figure.dataset.selected;
                        last_selected_was_already_marked = true;
                    } else {
                        figure.dataset.selected = true;
                        last_selected_was_already_marked = false;
                    }
                    last_selected_i = sym_i;
                }

                e.stopPropagation();

                update_sym_form();

                //         sym_cw_change.remove();
                //         sym_cw_new.parentNode.insertBefore(sym_cw_change, sym_cw_new);
                //         sym_cw_delete.style.display = '';
                //         // Only allow delete button if there are no images using it
                //         sym_cw_delete.disabled = cw.imgs_using > 0;
            });
        }

        let old_sym_list = document.getElementById('sym_list');
        old_sym_list.parentNode.replaceChild(new_sym_list, old_sym_list);
    }

    // // The buttons to actually do things
    // function perform_input_validation(read_id) {
    //     let new_text = sym_cw_text.value;

    //     if (!new_text) {
    //         sym_cw_text.focus();
    //         sym_status.className = "status_error";
    //         sym_status.innerText = "Must have some text";
    //         return;
    //     }

    //     let query_data = [new_text];
    //     if (read_id) {
    //         query_data.push(BigInt(new_sym_list.value));
    //     }
    //     return {
    //         query_insert_args: "(text, id)",
    //         query_update_args: "text = ?",
    //         query_data,
    //     };
    // }

    // sym_cw_change.onclick = () => {
    //     let changed_cw = perform_input_validation(true);
    //     if (changed_cw === undefined) return;

    //     let { query_update_args, query_data } = changed_cw;
    //     database.exec(`update page_cw set ${query_update_args} where id = ?`, {
    //         bind: query_data
    //     });

    //     // Ok
    //     reset_ui();

    //     sym_status.className = "status_ok";
    //     sym_status.innerText = "OK!";
    //     download_changes_elem.style.visibility = '';
    // };
    // sym_cw_new.onclick = () => {
    //     let new_cw = perform_input_validation(false);
    //     if (new_cw === undefined) return;

    //     let { query_insert_args, query_data } = new_cw;

    //     let new_id = Snowflake.generate();
    //     query_data.push(new_id);

    //     let query_values = []
    //     for (let i = 0; i < query_data.length; i++)
    //         query_values.push('?');
    //     query_values = query_values.join(', ');

    //     database.exec(`insert into page_cw ${query_insert_args} values (${query_values})`, {
    //         bind: query_data
    //     });

    //     // Ok
    //     reset_ui();

    //     sym_status.className = "status_ok";
    //     sym_status.innerText = `OK, new id ${new_id}!`;
    //     download_changes_elem.style.visibility = '';
    // };
    // sym_cw_delete.onclick = () => {
    //     let sym_id = new_sym_list.value;
    //     if (!sym_id) {
    //         sym_status.className = "status_error";
    //         sym_status.innerText = "No CW selected";
    //         return;
    //     }
    //     sym_id = BigInt(sym_id);

    //     let sym_data = all_syms_map.get(sym_id);
    //     if (sym_data.imgs_using > 0) {
    //         sym_status.className = "status_error";
    //         sym_status.innerText = "Cannot delete, there are symbols using it";
    //         return;
    //     }

    //     database.exec(`delete from page_cw where id = ?`, {
    //         bind: [sym_id]
    //     });

    //     // Ok
    //     reset_ui();

    //     sym_status.className = "status_ok";
    //     sym_status.innerText = "OK!";
    //     download_changes_elem.style.visibility = '';
    // }

    // Set up the UI the first time
    reset_ui();
}