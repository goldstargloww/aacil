import csv
import os
import sys

filename = sys.argv[1]
cleaned_file = filename + '.new'

seen_files = {}

anything_changed = False
with open(filename, 'r', newline='') as fr:
    with open(cleaned_file, 'w', newline='') as fw:
        reader = csv.DictReader(fr)
        writer = csv.DictWriter(fw, fieldnames=["Image URL", "Credit", "Caption", "Alt text"])
        writer.writeheader()

        for row in reader:
            if row["Image URL"] in seen_files:
                existing_row = seen_files[row["Image URL"]]
                if existing_row == row:
                    print(f"Duplicate found! {row["Image URL"]}")
                    anything_changed = True
                    continue
                print(f"BAD! Duplicate found! {row["Image URL"]}")

            seen_files[row["Image URL"]] = row
            writer.writerow(row)

if not anything_changed:
    os.unlink(cleaned_file)
else:
    os.replace(cleaned_file, filename)
