#!/usr/bin/env python3

from jinja2 import Environment, FileSystemLoader, select_autoescape
import csv
import glob
import os

# Get the directory this script is found in
REPO_ROOT = os.path.dirname(os.path.realpath(__file__))


def find_all_csv_files():
    return glob.glob(f'{REPO_ROOT}/site/**/*.csv', recursive=True)


def generate_one_page(csv_filename, template):
    # Load CSV
    with open(csv_filename, 'r', newline='') as f:
        reader = csv.DictReader(f)
        figs = list(reader)

    # .csv -> index.html
    html_filename = os.path.dirname(csv_filename) + '/index.html'

    # Actually make the output
    rendered = template.render(figs=figs)
    with open(html_filename, 'w') as f:
        f.write(rendered)


def main():
    jinja_env = Environment(
        loader=FileSystemLoader(REPO_ROOT + '/templates'),
        autoescape=select_autoescape(),
    )
    category_template = jinja_env.get_template("category.html")

    all_csvs = find_all_csv_files()
    for csv_file in all_csvs:
        generate_one_page(csv_file, category_template)


if __name__ == '__main__':
    main()
