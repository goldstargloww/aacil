import sqlite3, re
import dominate
from dominate.tags import *


conn = sqlite3.connect("symbols.db")
cursor = conn.cursor()

cursor.execute("SELECT * from symbols WHERE pages Like '%''aac''%'")

results = cursor.fetchall()

symbols = []
for result in results:
    symbols.append(
        {
            "file": "/assets/symbols/" + result[0].split("/")[-1],
            # "pages": result[1],
            "label": result[2],
            "alt": result[3],
            "artists": eval(result[4]),
            "credit": result[5],
        }
    )


doc = dominate.document(title="AAC | AAC Image Library")

with doc.head:
    meta(charset="UTF-8")
    meta(name="viewport", content="width=device-width, initial-scale=1.0")
    link(rel="icon", type="image/png", href="/favicon.png")
    link(rel="stylesheet", href="style.css")

with doc:
    for symbol in symbols:
        fig = figure()
        fig.add(img(src=symbol["file"], width=300, alt=symbol["alt"]))

        cap = fig.add(figcaption())
        cap.add(span(symbol["label"], className="caption"))

        if symbol["credit"] == "edit":
            artists = "by {}, edited by {}".format(*symbol["artists"])
        elif len(symbol["artists"]) == 3:
            artists = "by {}, {}, and {}".format(*symbol["artists"])
        elif len(symbol["artists"]) == 2:
            artists = "by {} and {}".format(*symbol["artists"])
        else:
            artists = "by {}".format(*symbol["artists"])

        cap.add(span(artists, className="credit"))


with open("generated-site/aac/index.html", "w", encoding="utf-8") as file:
    file.write(doc.render())
