import json, sqlite3, re

conn = sqlite3.connect("symbols.db")
cursor = conn.cursor()

cursor.execute("SELECT * FROM symbols")
rows = cursor.fetchall()

by_pattern = re.compile(r"^\s*\|\s*(By )?(.+)", re.I)
and_pattern = re.compile(r"\[['\"](.+) (&|and) (.+)['\"]\]", re.I)
collab_pattern = re.compile(r"\['Collaboration by (.+), (.+)', '(.+)'\]", re.I)
adapted_by_pattern = re.compile(r"\[['\"](.+), (adapted|modified) by (.+)['\"]\]", re.I)
adapted_from_pattern = re.compile(r"\[['\"](.+), adapted from (.+)['\"]\]", re.I)
adapted_from_pattern2 = re.compile(r"\[['\"](.+) \(adapted from (.+)\)['\"]\]", re.I)


def format_row(row):
    file, pages, label, alt, artists, credit = row

    artists = eval(artists)
    if credit == "edit":
        artist_string = "by {}, edited by {}".format(*artists)
    elif len(artists) == 3:
        artist_string = "by {}, {}, and {}".format(*artists)
    elif len(artists) == 2:
        artist_string = "by {} and {}".format(*artists)
    else:
        artist_string = "by {}".format(*artists)

    return {
        "file": file.strip(),
        "pages": eval(pages),
        "label": label,
        "alt": alt,
        "artists": artists,
        "artist_string": artist_string,
        "credit": credit,
    }


data = [format_row(row) for row in rows]

with open("symbols.json", "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4, ensure_ascii=False)
with open("generated-site/symbols.json", "w", encoding="utf-8") as file:
    json.dump(data, file, indent=4, ensure_ascii=False)
