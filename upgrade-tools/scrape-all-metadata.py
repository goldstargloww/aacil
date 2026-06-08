# This program is only designed to be run once.
# It takes all of the existing HTML files and extracts
# the metadata (caption, credit, alt text, filename)
# into machine-readable form

from bs4 import BeautifulSoup
import glob
import json
import os.path
import urllib.parse

# Find all html files *except* the top-level ones
all_html_files = sorted(glob.glob('../site/*/**/*.html', recursive=True))
# for x in all_html_files:
#     print(x)


def parse_one_file(fn):
    with open(fn, 'r') as f:
        soup = BeautifulSoup(f, 'html5lib')

    figures = soup.find_all('figure')
    all_figs_meta = []

    for fig in figures:
        alt_text = fig.img.get('alt').strip()
        url = fig.img.get('src').strip()
        caption = fig.find(class_="caption").get_text().strip()
        credit = fig.find(class_="credit").get_text().strip()

        # This should never happen, we're validating the data quality
        if not credit.startswith("| By ") and not credit.startswith("| by "):
            print(f"WARN BAD! '{credit}'")
            assert False

        # Remove the "| By " part
        credit = credit[5:]

        if credit.endswith('.'):
            credit = credit[:-1].strip()

        # This should never happen either
        if not url.startswith('/'):
            print(f"WARN BAD! '{url}'")
            assert False

        # Make sure the image actually exists
        url = urllib.parse.unquote(url)
        if not os.path.exists('../site' + url):
            print(f"WARN BAD! '{url}' '{caption}'")
            # For now, some files are just missing
            continue

        # Make sure this is all filled in correctly
        if not alt_text or not caption or not credit:
            print(f"WARN BAD! '{url}'")
            assert False

        # print(alt_text, url, caption, credit)
        all_figs_meta.append((alt_text, url, caption, credit))

    return all_figs_meta


# Dump all metadata
all_all_figs = {}
for fn in all_html_files:
    print(fn)
    site_figs = parse_one_file(fn)
    all_all_figs[fn] = site_figs

with open("test.json", 'w') as f:
    json.dump(all_all_figs, f, sort_keys=True, indent=2)

# Dump all known images
all_image_filenames = set()
for site_figs in all_all_figs.values():
    for fig in site_figs:
        all_image_filenames.add(fig[1])
all_image_filenames = sorted(all_image_filenames)

with open("all_images.txt", "w") as f:
    for x in all_image_filenames:
        f.write(x + '\n')
