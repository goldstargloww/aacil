import sqlite3, re, os
import dominate
from dominate.tags import *


pages = {
    "aac-organization": "AAC Organization",
    "aac-organization/letter-folders": "Letter Folders",
    "aac-organization/templates": "Templates",
    "aac": "AAC",
    "aac/verbality": "Verbality",
    "actions": "Actions",
    "actions/adls": "ADLs",
    "actions/adls/conditioning-hair": "Conditioning Hair",
    "actions/cognitive": "Cognitive",
    "actions/mobility": "Mobility",
    "actions/sensing": "Sensing",
    "actions/stimming": "Stimming",
    "actions/talking": "Talking",
    "arts-and-crafts": "Arts & Crafts",
    "body": "Body",
    "body/chest": "Chest",
    "body/facial-features": "Facial Features",
    "body/genitalia": "Genitalia",
    "body/hair": "Hair",
    "body/menstruation": "Menstruation",
    "colors": "Colors",
    "concepts": "Concepts",
    "concepts/astrology": "Astrology",
    "concepts/physics": "Physics",
    "description": "Description",
    "description/quantity": "Quantity",
    "directions": "Directions",
    "disability": "Disability",
    "disability/delusions-hallucinations": "Delusions & Hallucinations",
    "disability/organizations": "Disability Organizations",
    "disability/personality-disorders": "Personality Disorders",
    "disability/plurality": "Plurality",
    "disability/specific-disabilities": "Specific Disabilities",
    "disability/specific-disabilities/paraphilia": "Paraphilia",
    "disability/specific-disabilities/phobias": "Phobias",
    "education": "Education",
    "education/math": "Math",
    "education/science": "Science",
    "feelings": "Feelings",
    "feelings/empathy": "Empathy",
    "history": "History",
    "human-rights-and-international-relations": "Human Rights & International Relations",
    "inflections": "Inflections",
    "law": "Law",
    "law/laws": "Laws",
    "lgbtq": "LGBTQ",
    "linguistics": "Linguistics",
    "linguistics/scripts/aurebesh": "Aurebesh",
    "linguistics/scripts/elder-futhark": "Elder Futhark",
    "linguistics/scripts/ender": "Ender",
    "linguistics/scripts/greek": "Greek",
    "linguistics/scripts/latin/lowercase": "Latin (Lowercase)",
    "linguistics/scripts/latin/uppercase": "Latin (Uppercase)",
    "linguistics/scripts/sitelen-pona": "Sitelen Pona",
    "media": "Media",
    "media/animal-crossing": "Animal Crossing",
    "media/minecraft": "Minecraft",
    "media/minecraft/cake": "Minecraft Cake",
    "media/my-little-pony": "My Little Pony",
    "media/pokemon": "Pokémon",
    "media/sonic": "Sonic",
    "media/star-trek": "Star Trek",
    "media/star-wars": "Star Wars",
    "media/the-magnus-archives": "The Magnus Archives",
    "media/tropes": "Tropes",
    "media/x-men": "X-Men",
    "medical": "Medical",
    "medical/allergies": "Allergies",
    "medical/tumors": "Tumors",
    "mental-health-crisis-and-death": "Mental Health Criss & Death",
    "money": "Money",
    "natural-disaster-and-emergency": "Natural Disaster & Emergency",
    "nature": "Nature",
    "nature/animals": "Animals",
    "nature/animals/bugs": "Bugs",
    "nature/astronomy": "Astronomy",
    "nature/elements": "Elements",
    "nature/genetics": "Genetics",
    "nature/plants": "Plants",
    "nature/weather": "Weather",
    "objects": "Objects",
    "objects/accessories": "Accessories",
    "objects/clothes": "Clothes",
    "objects/food": "Food",
    "objects/food/dietary-requirements": "Dietary Requirements",
    "objects/food/drink": "Drink",
    "objects/food/fruit": "Fruit",
    "objects/food/seasoning": "Seasoning",
    "objects/furniture": "Furniture",
    "objects/religion": "Religion",
    "objects/religion/buddhism": "Buddhism",
    "objects/religion/christianity": "Christianity",
    "objects/religion/folklore": "Folklore",
    "objects/religion/folklore/tarot": "Tarot",
    "objects/religion/islam": "Islam",
    "objects/religion/judaism": "Judaism",
    "objects/religious-head-coverings": "Religious Head Coverings",
    "objects/soft-toys": "Soft Toys",
    "objects/substances": "Substances",
    "pain": "Pain",
    "pain/locations": "Pain Locations",
    "pain/pain-charts-and-levels": "Pain Charts & Levels",
    "people": "People",
    "people/endearment": "Endearment",
    "people/relationships": "Relationships",
    "people/specific-people": "Specific People",
    "phrases": "Phrases",
    "places": "Places",
    "places/countries-and-regions": "Countries & Regions",
    "places/mountains": "Mountains",
    "punctuation": "Punctuation",
    "self-advocacy": "Self-Advocacy",
    "self-advocacy/bigotry": "Bigotry",
    "self-advocacy/disability": "Disability (Self Advocacy)",
    "sex": "Sex",
    "small-and-core-words": "Small & Core Words",
    "small-and-core-words/pronouns": "Pronouns",
    "small-and-core-words/pronouns/neopronouns": "Neopronouns",
    "small-and-core-words/so": "So (Small & Core Words)",
    "sociology": "Sociology",
    "sports-and-games": "Sports & Games",
    "sports-and-games/magic-the-gathering": "Magic: The Gathering",
    "sports-and-games/tabletop-roleplaying-games": "Tabletop Roleplaying Games",
    "supports": "Supports",
    "supports/braces": "Braces",
    "supports/mobility-aids": "Mobility Aids",
    "swearing": "Swearing",
    "technology": "Technology",
    "time": "Time",
    "time/holidays": "Holidays",
    "time/holidays/christmas": "Christmas",
    "trauma-and-abuse": "Trauma & Abuse",
}


conn = sqlite3.connect("symbols.db")
cursor = conn.cursor()


for page_path in pages.keys():
    page_name = pages[page_path]

    cursor.execute(f"SELECT * from symbols WHERE pages Like ?", [f"%'{page_path}'%"])

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

    doc = dominate.document(title=f"{page_name} | AAC Image Library")

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

    os.makedirs(f"generated-site/{page_path}", exist_ok=True)
    with open(f"generated-site/{page_path}/index.html", "w", encoding="utf-8") as file:
        file.write(doc.render())
