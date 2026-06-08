import csv
import glob
import os

# Get the directory this script is found in
REPO_ROOT = os.path.dirname(os.path.realpath(__file__))

all_csvs = glob.glob(f'{REPO_ROOT}/../site/**/*.csv', recursive=True)
# print(all_csvs)

urls_refed = {}
want_to_move = {}
for csvfile in all_csvs:
    csvfile_rel = csvfile[len(f'{REPO_ROOT}/../site'):]
    this_cat = csvfile_rel.rsplit('/', 1)[0]
    urls_refed[this_cat] = set()
    with open(csvfile, 'r', newline='') as fr:
        reader = csv.DictReader(fr)
        for row in reader:
            url = row["Image URL"]

            if not url.startswith('/'):
                urls_refed[this_cat].add(f"{this_cat}/{url}")
            else:
                urls_refed[this_cat].add(url)

            if url.startswith('/'):
                want_to_move[url] = this_cat
want_to_move = sorted(want_to_move.items())
# for (img_url, to_dir) in want_to_move:
#     print(f"Want to move {img_url} -> {to_dir}")
# for (cat, urls) in urls_refed.items():
#     for url in urls:
#         print(f"Category {cat} uses {url}")

referenced_by_cats = {}
for (cat, urls) in urls_refed.items():
    for url in urls:
        if url not in referenced_by_cats:
            referenced_by_cats[url] = set()
        referenced_by_cats[url].add(cat)
for (url, cats) in referenced_by_cats.items():
    if len(cats) > 1:
        print(f"{url} used by {cats}")

for (img_url, to_dir) in want_to_move:
    if len(referenced_by_cats[img_url]) == 1:
        print(f"Ok to move {img_url} -> {to_dir}")


# DANGEROUS bit, actually writes files
for csvfile in all_csvs:
    with open(csvfile, 'r', newline='') as fr:
        with open(csvfile + '.new', 'w', newline='') as fw:
            reader = csv.DictReader(fr)
            writer = csv.DictWriter(fw, fieldnames=["Image URL", "Credit", "Caption", "Alt text"])
            writer.writeheader()
            for row in reader:
                url = row["Image URL"]

                if url.startswith('/'):
                    # Want to move
                    if len(referenced_by_cats[url]) == 1:
                        # OK to move
                        row["Image URL"] = os.path.basename(row["Image URL"])

                writer.writerow(row)
    os.replace(csvfile + '.new', csvfile)
