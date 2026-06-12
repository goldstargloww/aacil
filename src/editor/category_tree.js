import * as sorting from '../sorting.js';

// Returns: {
//      $children: [...]
//      $parent: <instance>
//      ...other DB data
// }
// Useful for displaying a tree of categories.
function get_category_tree(database, node_id) {
    // Ask the database for this node's information
    let node_info = [];
    database.exec(`select * from categories where id = ?`, {
        bind: [node_id],
        rowMode: 'object',
        resultRows: node_info,
    });

    // Ask the database for children (subcategories)
    let children = [];
    database.exec(`select child_id from subcategories where parent_id = ?`, {
        bind: [node_id],
        resultRows: children,
    });

    let node = {
        $children: [],
        $parent: null,
        ...node_info[0],
    };

    node.$children = children.map((x) => {
        let child_node_id = x[0];
        let child_node_obj = get_category_tree(database, child_node_id);
        child_node_obj.$parent = node;
        return child_node_obj;
    });
    node.$children.sort(sorting.sort_categories);

    return node;
}

// Flatten category tree into a list, "preorder traversal"
// Yields a list of {
//      id: BigInt,
//      desc_path: string,
//      url_path: string,
// }
// Used specifically to allow *choosing* a category
function flatten_category_tree(cat_tree) {
    let flattened = [];
    function flatten_recurse(node, desc_path, url_path) {
        // Don't emit the root, otherwise emit self
        if (node.id !== 0) {
            desc_path.push(node.desc);
            url_path.push(node.url_path);
            flattened.push({
                id: node.id,
                desc_path: desc_path.join(" > "),
                url_path: '/' + url_path.join("/") + '/',
            });
        }

        for (let child of node.$children) {
            let desc_path_new = desc_path.slice(0);
            let url_path_new = url_path.slice(0);
            flatten_recurse(child, desc_path_new, url_path_new);
        }
    }
    flatten_recurse(cat_tree, [], []);
    return flattened;
}

function make_cat_tree_ui(cat_tree, cb) {
    let new_cat_tree = document.createElement('ol');
    new_cat_tree.id = 'cat_tree';

    function make_recurse(node) {
        let li = document.createElement('li');
        let li_div = document.createElement('div');
        li.appendChild(li_div);
        let li_span = document.createElement('span');
        li_div.appendChild(li_span);
        li_span.innerText = node.desc;
        li.addEventListener('click', async (e) => {
            // Clear all the existing selections
            for (let e of new_cat_tree.querySelectorAll('[data-selected]')) {
                delete e.dataset.selected;
            }

            li.dataset.selected = true;
            let parent_id = null;
            if (node.$parent)
                parent_id = node.$parent.id
            await cb(node.id, parent_id);
            e.stopPropagation();
        });

        if (node.$children.length > 0) {
            let ol_child = document.createElement('ol');
            for (let child of node.$children) {
                ol_child.appendChild(make_recurse(child));
            }
            li.appendChild(ol_child);
        }

        return li;
    }

    let li = make_recurse(cat_tree);
    new_cat_tree.appendChild(li);

    document.getElementById('cat_tree').replaceWith(new_cat_tree);

    document.getElementById('with_cat_tree').style.display = '';
}

// (Re-)create the category UI, which calls `cb` when something is clicked
// cb(cat_id, from_parent_id)
//
// Returns the flattened category list and the dropdown DOM node
export function remake_category_ui(database, cb, dropdown_allow_root = false) {
    // Load information about categories out of DB into memory
    let category_tree = get_category_tree(database, 0);
    let category_list = flatten_category_tree(category_tree);

    // Make the sidebar UI
    make_cat_tree_ui(category_tree, cb);

    // Populate the selection dropdown for moving stuff between categories
    let new_category_move_select = document.createElement('select');
    new_category_move_select.id = 'category_move_select';

    if (dropdown_allow_root) {
        let option = document.createElement('option');
        option.value = 0;
        option.innerText = "<root>";
        new_category_move_select.appendChild(option);
    }

    for (let category of category_list) {
        let option = document.createElement('option');
        option.value = category.id;
        option.innerText = category.desc_path;
        new_category_move_select.appendChild(option);
    }

    document.getElementById('category_move_select').replaceWith(new_category_move_select);

    return { category_list, category_move_select: new_category_move_select };
}
