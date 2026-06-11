import csv
import glob
import os

# Get the directory this script is found in
REPO_ROOT = os.path.realpath(os.path.dirname(os.path.realpath(__file__)) + "/..")

import sys
sys.path.insert(0, REPO_ROOT)

import make_site


make_site.CATEGORY_FRIENDLY_NAMES.update({
    ('/Linguistics/glyphs', 'latin lc'): 'lowercase latin letters (abcs)',
    ('/Linguistics/glyphs', 'latin uc'): 'uppercase latin letters (ABCs)',
    ('/Linguistics/glyphs', 'aurebesh'): 'aurebesh letters',
    ('/Linguistics/glyphs', 'furthark'): 'the Elder Furthark',
    ('/Linguistics/glyphs', 'ender'): 'Ender glyphs',
    ('/Linguistics/glyphs', 'greek'): 'ancient Greek letters',
    # ('/Linguistics/glyphs', 'sitelen pona'): 'sitelen pona',
})


from snowflake import SnowflakeGenerator
gen = SnowflakeGenerator(0)

img_to_id = {}
with open('site/database/images.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        img_to_id[row['filename']] = row['id']

all_csvs = make_site.find_all_csv_files()
category_tree = make_site.collect_categories(all_csvs)
del category_tree["database"]
# print(category_tree)

root_cat_id = 0

all_cats = {
    root_cat_id: {
        'desc': '<root>',
        'icon_id': None,
        'cw': None,
    }
}
legacy_cat_to_id = {
    '': root_cat_id,
}

subcats = []


def walk_cat_tree(node, path_so_far=''):
    for (cat_path_seg, children) in node.items():
        legacy_cat_name = path_so_far + '/' + cat_path_seg
        # print(legacy_cat_name)

        # HACKS
        if legacy_cat_name == '/Linguistics/glyphs':
            walk_cat_tree(children, legacy_cat_name)
            continue

        # This is _a_ category, so assign it an id
        cat_id = next(gen)

        # Friendly description
        if (path_so_far, cat_path_seg) in make_site.CATEGORY_FRIENDLY_NAMES:
            cat_desc = make_site.CATEGORY_FRIENDLY_NAMES[(path_so_far, cat_path_seg)]
        else:
            cat_desc = cat_path_seg

        # Icons
        icon_id = None
        if legacy_cat_name in make_site.CATEGORY_ICONS:
            icon_path = legacy_cat_name + '/' + make_site.CATEGORY_ICONS[legacy_cat_name]
            icon_path = os.path.normpath(icon_path)

            # print(icon_path)
            assert os.path.exists(REPO_ROOT + "/site" + icon_path)
            icon_id = img_to_id[icon_path]

        # CW (hardcoded)
        cw = None
        if legacy_cat_name == '/MH':
            # print("MH")
            cw = "Warning: Potentially Distressing Content Ahead"
        elif legacy_cat_name == '/Sex':
            # print("Sex")
            cw = "Warning: Adult Content Ahead"
        elif legacy_cat_name == '/Swearing':
            # print("Swearing")
            cw = "Warning: Crude Words and Images Ahead"

        all_cats[cat_id] = {
            'desc': cat_desc,
            'icon_id': icon_id,
            'cw': cw,
        }
        assert legacy_cat_name not in legacy_cat_to_id
        legacy_cat_to_id[legacy_cat_name] = cat_id

        # HACKS
        path_so_far_xxx = path_so_far
        if path_so_far_xxx == '/Linguistics/glyphs':
            path_so_far_xxx = '/Linguistics'

        parent_cat_id = legacy_cat_to_id[path_so_far_xxx]
        assert (parent_cat_id, cat_id) not in subcats
        subcats.append((parent_cat_id, cat_id))

        walk_cat_tree(children, legacy_cat_name)
walk_cat_tree(category_tree)
# print(all_cats)
# print(subcats)
# print(legacy_cat_to_id)

# Load symbols
symbols_in_cat = set()
for csv_filename in all_csvs:
    remove_prefix = f'{REPO_ROOT}/site'
    assert csv_filename.startswith(remove_prefix)
    this_cat = os.path.dirname(csv_filename[len(remove_prefix):])

    if this_cat == '/database':
        continue

    # HACK
    if this_cat == '/Linguistics/glyphs':
        continue

    cat_id = legacy_cat_to_id[this_cat]
    # print(cat_id)

    # Load CSV
    with open(csv_filename, 'r', newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # This marks the separation with CWed items
            if row["Image URL"] == '----------':
                continue

            # Resolve the URL appropriately
            url = row["Image URL"]
            if not url.startswith('/'):
                url = this_cat+'/'+url
            url = os.path.normpath(url)
            # row["Image URL"] = url

            img_id = img_to_id[url]

            ent = (cat_id, img_id)
            assert ent not in symbols_in_cat
            symbols_in_cat.add(ent)

for (legacy_cat, _) in make_site.MAIN_PAGE_EXTRA_CATEGORIES:
    new_thing = (root_cat_id, legacy_cat_to_id[legacy_cat])
    assert new_thing not in subcats
    subcats.append(new_thing)

# HACK move bugs
subcats.remove((legacy_cat_to_id['/Nature/animals'], legacy_cat_to_id['/Nature/animals/bugs']))
subcats.append((legacy_cat_to_id['/Nature'], legacy_cat_to_id['/Nature/animals/bugs']))

for (parent, children) in make_site.EXTRA_SUBCATEGORIES.items():
    # HACK
    if parent == '/Linguistics':
        continue
    if parent == '/Nature':
        continue
    # print(parent, children)

    assert len(children) == 1 # DEBUG
    for (child, _) in children:
        child = child[:-1]
        # print(parent, child)
        new_thing = (legacy_cat_to_id[parent], legacy_cat_to_id[child])
        assert new_thing not in subcats
        subcats.append(new_thing)

with open('categories.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'desc', 'icon_id', 'cw'])
    writer.writeheader()
    for x in sorted(all_cats.keys()):
        writer.writerow({
            'id': x,
            **all_cats[x],
        })

subcats.sort()
with open('subcategories.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['parent_id', 'child_id'])
    writer.writeheader()
    for x in subcats:
        writer.writerow({
            'parent_id': x[0],
            'child_id': x[1],
        })

symbols_in_cat = sorted(symbols_in_cat)
with open('cat_syms.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['cat_id', 'img_id', 'override_caption'])
    writer.writeheader()
    for x in symbols_in_cat:
        writer.writerow({
            'cat_id': x[0],
            'img_id': x[1],
        })
