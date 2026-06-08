#!/usr/bin/env python3

from jinja2 import Environment, FileSystemLoader, select_autoescape
import csv
import glob
import os

# Get the directory this script is found in
REPO_ROOT = os.path.dirname(os.path.realpath(__file__))

# TODO: We should make this more user-friendly to edit
SUBCATEGORY_FRIENDLY_NAMES = {
    ('/AAC Org', 'bodymedical'): "body & medical folders"
}


def find_all_csv_files():
    return glob.glob(f'{REPO_ROOT}/site/**/*.csv', recursive=True)


def collect_subcategories(all_csv_files):
    subcategories = {}

    for csv_file in all_csv_files:
        remove_prefix = f'{REPO_ROOT}/site'
        assert csv_file.startswith(remove_prefix)
        csv_file_name = csv_file[len(remove_prefix):]

        # This is the path the CSV file is in,
        # e.g. /AAC Org/aacorg.csv --> /AAC Org
        containing_dir_name = os.path.dirname(csv_file_name)
        # This is one level further up,
        # e.g. /AAC Org/aacorg.csv --> /AAC Org --> /
        parent_dir_name = os.path.dirname(containing_dir_name)
        # The name of just this category by itself
        # e.g. /AAC Org/aacorg.csv --> /AAC Org --> AAC Org
        this_category_name = os.path.basename(containing_dir_name)
        # Make sure it was all correct
        assert this_category_name
        if parent_dir_name == '/':
            assert containing_dir_name == '/'+this_category_name
        else:
            assert containing_dir_name == parent_dir_name \
                + '/'+this_category_name

        if parent_dir_name not in subcategories:
            subcategories[parent_dir_name] = []
        subcategories[parent_dir_name].append(this_category_name)

    return subcategories


def generate_one_page(csv_filename, all_subcategories, template):
    # Get the URL for looking up subcategories
    remove_prefix = f'{REPO_ROOT}/site'
    assert csv_filename.startswith(remove_prefix)
    this_cat = os.path.dirname(csv_filename[len(remove_prefix):])

    # Look up the subcategories
    if this_cat in all_subcategories:
        subcategories = sorted(all_subcategories[this_cat])
        # print(this_cat, subcategories)
    else:
        subcategories = []

    # Get the human-friendly subcategory names
    subcat_names = []
    for subcat in subcategories:
        if (this_cat, subcat) in SUBCATEGORY_FRIENDLY_NAMES:
            subcat_names.append(SUBCATEGORY_FRIENDLY_NAMES[this_cat, subcat])
        else:
            subcat_names.append(subcat)

    # Load CSV
    with open(csv_filename, 'r', newline='') as f:
        reader = csv.DictReader(f)
        figs = list(reader)

    # .csv -> index.html
    html_filename = os.path.dirname(csv_filename) + '/index.html'

    # Actually make the output
    subcats = list(zip(subcategories, subcat_names))
    rendered = template.render(figs=figs, subcats=subcats)
    with open(html_filename, 'w') as f:
        f.write(rendered)


def main():
    jinja_env = Environment(
        loader=FileSystemLoader(REPO_ROOT + '/templates'),
        autoescape=select_autoescape(),
    )
    category_template = jinja_env.get_template("category.html")

    all_csvs = find_all_csv_files()
    subcategories = collect_subcategories(all_csvs)
    for csv_file in all_csvs:
        generate_one_page(csv_file, subcategories, category_template)


if __name__ == '__main__':
    main()
