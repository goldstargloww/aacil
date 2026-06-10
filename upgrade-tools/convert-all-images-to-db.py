import csv
import glob
import os

# Get the directory this script is found in
REPO_ROOT = os.path.dirname(os.path.realpath(__file__))

all_csvs = glob.glob(f'{REPO_ROOT}/../site/**/*.csv', recursive=True)
remove_prefix = f'{REPO_ROOT}/../site'

all_images = {}

for csv_filename in all_csvs:
    assert csv_filename.startswith(remove_prefix)
    this_cat = os.path.dirname(csv_filename[len(remove_prefix):])
    # print(this_cat)

    if this_cat == '/database':
        continue

    with open(csv_filename, 'r', newline='') as fr:
        reader = csv.DictReader(fr)
        is_in_cw_mode = False
        for row in reader:
            img_filename = row["Image URL"]

            if row["Image URL"] == '----------':
                is_in_cw_mode = True
                continue

            if not img_filename.startswith('/'):
                img_filename = this_cat + '/' + img_filename
            img_filename = os.path.normpath(img_filename)
            # print(img_filename)

            assert os.path.exists(f'{REPO_ROOT}/../site{img_filename}')

            metadata = {
                "credit": row["Credit"],
                "caption": row["Caption"],
                "alt": row["Alt text"],
            }

            if is_in_cw_mode:
                cw_ref = {
                    '/Body/menstruation': 7470590506913810376,
                    '/Disability/plurality_system': 7470590509583732933,
                    '/LBGT_': 7470590512667017331,
                    '/LBGT_/intersex': 7470590515564031564,
                    '/Medical': 7470590518134190949,
                    '/Objects/substances': 7470590518134190949,
                    '/Small-Core words': 7470590512667017331,
                }[this_cat]
                metadata["cw"] = cw_ref

            if img_filename in all_images:
                old_metadata = all_images[img_filename]

                if "cw" in old_metadata and "cw" not in metadata:
                    metadata["cw"] = old_metadata["cw"]
                if "cw" in metadata and "cw" not in old_metadata:
                    old_metadata["cw"] = metadata["cw"]

                if old_metadata != metadata:
                    print(img_filename)
                    ...

            all_images[img_filename] = metadata

sorted_all_images = sorted(all_images.keys())
# for x in sorted_all_images:
#     print(x)

from snowflake import SnowflakeGenerator
gen = SnowflakeGenerator(0)
with open('images.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['id', 'filename', 'caption', 'alt_text', 'cw_id'])
    writer.writeheader()

    for img_filename in sorted_all_images:
        if "cw" in all_images[img_filename]:
            cw = all_images[img_filename]["cw"]
        else:
            cw = None

        writer.writerow({
            'id': next(gen),
            'filename': img_filename,
            'caption': all_images[img_filename]["caption"],
            'alt_text': all_images[img_filename]["alt"],
            'cw_id': cw,
        })
