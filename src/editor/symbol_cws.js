import * as sorting from '../sorting.js';

export async function load_sym_cw_info(database, download_changes_elem) {
    let dummy_element_parking_lot = document.getElementById('dummy_element_parking_lot');

    let sym_cw_cur_id = document.getElementById('sym_cw_cur_id');
    let sym_cw_status = document.getElementById('sym_cw_status');
    let sym_cw_text = document.getElementById('sym_cw_text');
    let sym_cw_change = document.getElementById('sym_cw_change');
    let sym_cw_new = document.getElementById('sym_cw_new');
    let sym_cw_delete = document.getElementById('sym_cw_delete');

    let all_sym_cw_map;
    let new_sym_cw_select;

    function reset_ui() {
        // Load all the existing CW information
        let all_cws = [];
        database.exec(`
            select page_cw.*, count(images.id) as imgs_using
                from page_cw left join images on images.cw_id = page_cw.id
                group by page_cw.id`, {
            rowMode: 'object',
            resultRows: all_cws,
        });
        all_cws.sort(sorting.sort_sym_cw);

        // Reset all the relevant UI
        sym_cw_status.innerHTML = '&nbsp;';
        sym_cw_cur_id.innerHTML = '&nbsp;';
        sym_cw_text.value = '';
        sym_cw_text.focus();
        // Temporarily remove this, so that we can programmatically change the default button
        sym_cw_change.remove();
        dummy_element_parking_lot.appendChild(sym_cw_change);
        sym_cw_delete.style.display = 'none';

        // Make entirely new list of CWs
        new_sym_cw_select = document.createElement('select');
        new_sym_cw_select.id = 'sym_cw_select'
        // Add an empty option
        new_sym_cw_select.appendChild(document.createElement('option'));

        all_sym_cw_map = new Map();
        for (let cw of all_cws) {
            let option = document.createElement('option');
            option.value = cw.id;
            option.innerText = cw.text;
            new_sym_cw_select.appendChild(option);

            all_sym_cw_map.set(cw.id, cw);
        }

        new_sym_cw_select.addEventListener('change', () => {
            let selected_cw_id = new_sym_cw_select.value;
            if (selected_cw_id) {
                selected_cw_id = BigInt(selected_cw_id);
                let cw = all_sym_cw_map.get(selected_cw_id);

                sym_cw_cur_id.innerText = `Selected CW ID: ${selected_cw_id} (used by ${cw.imgs_using} symbols)`;
                sym_cw_text.value = cw.text;

                sym_cw_change.remove();
                sym_cw_new.parentNode.insertBefore(sym_cw_change, sym_cw_new);
                sym_cw_delete.style.display = '';
                // Only allow delete button if there are no images using it
                sym_cw_delete.disabled = cw.imgs_using > 0;
            } else {
                sym_cw_cur_id.innerHTML = '&nbsp;';
                sym_cw_text.value = '';

                sym_cw_change.remove();
                dummy_element_parking_lot.appendChild(sym_cw_change);
                sym_cw_delete.style.display = 'none';
            }
        });

        let old_sym_cw_select = document.getElementById('sym_cw_select');
        old_sym_cw_select.parentNode.replaceChild(new_sym_cw_select, old_sym_cw_select);
    }

    // The buttons to actually do things
    function perform_input_validation(read_id) {
        let new_text = sym_cw_text.value;

        if (!new_text) {
            sym_cw_text.focus();
            sym_cw_status.className = "status_error";
            sym_cw_status.innerText = "Must have some text";
            return;
        }

        let query_data = [new_text];
        if (read_id) {
            query_data.push(BigInt(new_sym_cw_select.value));
        }
        return {
            query_insert_args: "(text, id)",
            query_update_args: "text = ?",
            query_data,
        };
    }

    sym_cw_change.onclick = () => {
        let changed_cw = perform_input_validation(true);
        if (changed_cw === undefined) return;

        let { query_update_args, query_data } = changed_cw;
        database.exec(`update page_cw set ${query_update_args} where id = ?`, {
            bind: query_data
        });

        // Ok
        reset_ui();

        sym_cw_status.className = "status_ok";
        sym_cw_status.innerText = "OK!";
        download_changes_elem.style.visibility = '';
    };
    sym_cw_new.onclick = () => {
        let new_cw = perform_input_validation(false);
        if (new_cw === undefined) return;

        let { query_insert_args, query_data } = new_cw;

        let new_id = Snowflake.generate();
        query_data.push(new_id);

        let query_values = []
        for (let i = 0; i < query_data.length; i++)
            query_values.push('?');
        query_values = query_values.join(', ');

        database.exec(`insert into page_cw ${query_insert_args} values (${query_values})`, {
            bind: query_data
        });

        // Ok
        reset_ui();

        sym_cw_status.className = "status_ok";
        sym_cw_status.innerText = `OK, new id ${new_id}!`;
        download_changes_elem.style.visibility = '';
    };
    sym_cw_delete.onclick = () => {
        let sym_id = new_sym_cw_select.value;
        if (!sym_id) {
            sym_cw_status.className = "status_error";
            sym_cw_status.innerText = "No CW selected";
            return;
        }
        sym_id = BigInt(sym_id);

        let sym_data = all_sym_cw_map.get(sym_id);
        if (sym_data.imgs_using > 0) {
            sym_cw_status.className = "status_error";
            sym_cw_status.innerText = "Cannot delete, there are symbols using it";
            return;
        }

        database.exec(`delete from page_cw where id = ?`, {
            bind: [sym_id]
        });

        // Ok
        reset_ui();

        sym_cw_status.className = "status_ok";
        sym_cw_status.innerText = "OK!";
        download_changes_elem.style.visibility = '';
    }

    // Set up the UI the first time
    reset_ui();
}
