import sqlite3, re
from bs4 import BeautifulSoup
from alive_progress import alive_bar


pages = [
    ("site/AAC/aac.html", "aac"),
    ("site/AAC/verbality/verbality.html", "aac/verbality"),
    ("site/AAC Org/aacorg.html", "aac-organization"),
    (
        "site/AAC Org/letter folders/letterfolders.html",
        "aac-organization/letter-folders",
    ),
    ("site/AAC Org/templates/t.html", "aac-organization/templates"),
    ("site/Actions/actions.html", "actions"),
    ("site/Actions/ADLs.html", "actions/adls"),
    ("site/Actions/mobility.html", "actions/mobility"),
    ("site/Actions/stimming.html", "actions/stimming"),
    ("site/Actions/cognitive/cognitive.html", "actions/cognitive"),
    ("site/Actions/ADLs/conditioning hair/ch.html", "actions/adls/conditioning-hair"),
    ("site/Actions/sensing/sensing.html", "actions/sensing"),
    ("site/Actions/talking/talking.html", "actions/talking"),
    ("site/Artscrafts/artscrafts.html", "arts-and-crafts"),
    ("site/Body/body.html", "body"),
    ("site/Body/chest/chest.html", "body/chest"),
    ("site/Body/facialfeatures.html", "body/facial-features"),
    ("site/Body/genitalia/g.html", "body/genitalia"),
    ("site/Body/hair/hair.html", "body/hair"),
    ("site/Body/menstruation/menstruation.html", "body/menstruation"),
    ("site/Colours/colours.html", "colors"),
    ("site/Concepts/concepts.html", "concepts"),
    (
        "site/Concepts/anthropology sociology/anthsoc.html",
        "concepts/anthropology-sociology",
    ),
    ("site/Concepts/astrology/astrology.html", "concepts/astrology"),
    ("site/Concepts/physics/physics.html", "concepts/physics"),
    ("site/description/description.html", "description"),
    ("site/description/quantity/quantities.html", "description/quantity"),
    ("site/Directions/directions.html", "directions"),
    ("site/Disability/disability.html", "disability"),
    (
        "site/Disability/delusion_hallucination/del_hal.html",
        "disability/delusions-hallucinations",
    ),
    ("site/Disability/orgs/organisations.html", "disability/organizations"),
    ("site/Disability/pd/pds.html", "disability/personality-disorders"),
    ("site/Disability/plurality_system/plurality_system.html", "disability/plurality"),
    ("site/Disability/specific_disabilities.html", "disability/specific-disabilities"),
    (
        "site/Disability/s/paraphilia/paraphilia.html",
        "disability/specific-disabilities/paraphilia",
    ),
    (
        "site/Disability/s/phobias/phobias.html",
        "disability/specific-disabilities/phobias",
    ),
    ("site/Education/education.html", "education"),
    ("site/Education/generalscience.html", "education/science"),
    ("site/Education/math/math.html", "education/math"),
    ("site/Feelings/feelings.html", "feelings"),
    ("site/Feelings/empathy/empathy.html", "feelings/empathy"),
    ("site/History/history.html", "history"),
    ("site/HR INR/hrinr.html", "human-rights-and-international-relations"),
    ("site/Inflections/inflections.html", "inflections"),
    ("site/Law/law.html", "law"),
    ("site/Law/laws/laws.html", "law/laws"),
    ("site/LBGT_/lbgtplus.html", "lgbtq"),
    ("site/Linguistics/linguistics.html", "linguistics"),
    ("site/Linguistics/glyphs/aurebesh/ab.html", "linguistics/scripts/aurebesh"),
    ("site/Linguistics/glyphs/ender/ender.html", "linguistics/scripts/ender"),
    ("site/Linguistics/glyphs/furthark/ef.html", "linguistics/scripts/elder-futhark"),
    ("site/Linguistics/glyphs/greek/greek.html", "linguistics/scripts/greek"),
    (
        "site/Linguistics/glyphs/latin lc/latinlowercase.html",
        "linguistics/scripts/latin/lowercase",
    ),
    (
        "site/Linguistics/glyphs/latin uc/latinuppercase.html",
        "linguistics/scripts/latin/uppercase",
    ),
    (
        "site/Linguistics/glyphs/sitelen pona/sitelen.html",
        "linguistics/scripts/sitelen-pona",
    ),
    ("site/Media/media.html", "media"),
    ("site/Media/Animal Crossing/ac.html", "media/animal-crossing"),
    ("site/Media/Minecraft/Minecraft.html", "media/minecraft"),
    ("site/Media/Minecraft/cake/cake.html", "media/minecraft/cake"),
    ("site/Media/My Little Pony/mlp.html", "media/my-little-pony"),
    ("site/Media/Pokemon/pokemon.html", "media/pokemon"),
    ("site/Media/Sega/sonic.html", "media/sonic"),
    ("site/Media/Star Trek/StarTrek.html", "media/star-trek"),
    ("site/Media/Star Wars/starwars.html", "media/star-wars"),
    ("site/Media/TMA/tma.html", "media/the-magnus-archives"),
    ("site/Media/Tropes/tropes.html", "media/tropes"),
    ("site/Media/X Men/xmen.html", "media/x-men"),
    ("site/Medical/medical.html", "medical"),
    ("site/Medical/allergy/allergies.html", "medical/allergies"),
    ("site/Medical/tumor/tumors.html", "medical/tumors"),
    ("site/MH/mh.html", "mental-health-crisis-and-death"),
    ("site/Money/money.html", "money"),
    ("site/Natural Disaster/emergency.html", "natural-disaster-and-emergency"),
    ("site/Nature/animals.html", "nature/animals"),
    ("site/Nature/astronomy.html", "nature/astronomy"),
    ("site/Nature/nature.html", "nature"),
    ("site/Nature/plants.html", "nature/plants"),
    ("site/Nature/animals/bugs.html", "nature/animals/bugs"),
    ("site/Nature/elements/elements.html", "nature/elements"),
    ("site/Nature/genetics/genetics.html", "nature/genetics"),
    ("site/Nature/weather/weather.html", "nature/weather"),
    ("site/Objects/objects.html", "objects"),
    ("site/Objects/accessories/accessories.html", "objects/accessories"),
    ("site/Objects/clothes/clothes.html", "objects/clothes"),
    ("site/Objects/food/dietaryrequirements.html", "objects/food/dietary-requirements"),
    ("site/Objects/food/drink.html", "objects/food/drink"),
    ("site/Objects/food/food.html", "objects/food"),
    ("site/Objects/food/fruit.html", "objects/food/fruit"),
    ("site/Objects/food/seasoning/seasoning.html", "objects/food/seasoning"),
    ("site/Objects/furniture/furniture.html", "objects/furniture"),
    ("site/Objects/religion/christianity.html", "objects/religion/christianity"),
    ("site/Objects/religion/islam.html", "objects/religion/islam"),
    ("site/Objects/religion/judaism.html", "objects/religion/judaism"),
    ("site/Objects/religion/religion.html", "objects/religion"),
    ("site/Objects/religion/buddhism/b.html", "objects/religion/buddhism"),
    ("site/Objects/religion/folklore/folklore.html", "objects/religion/folklore"),
    (
        "site/Objects/religion/folklore/tarot/tarot.html",
        "objects/religion/folklore/tarot",
    ),
    (
        "site/Objects/religious head coverings/headcoverings.html",
        "objects/religious-head-coverings",
    ),
    ("site/Objects/soft toys/softtoys.html", "objects/soft-toys"),
    ("site/Objects/substances/substances.html", "objects/substances"),
    ("site/Pain/pain.html", "pain"),
    ("site/Pain/charts levels/cl.html", "pain/pain-charts-and-levels"),
    ("site/Pain/parts/specific.html", "pain/locations"),
    ("site/People/people.html", "people"),
    ("site/People/endearment/endearment.html", "people/endearment"),
    ("site/People/r/relationships.html", "people/relationships"),
    ("site/People/specific people/s_people.html", "people/specific-people"),
    ("site/Phrases/phrases.html", "phrases"),
    ("site/Places/countriesregions.html", "places/countries-and-regions"),
    ("site/Places/mountains.html", "places/mountains"),
    ("site/Places/places.html", "places"),
    ("site/Punctuation/punctuation.html", "punctuation"),
    ("site/Self-Advocacy/self-advocacy.html", "self-advocacy"),
    ("site/Self-Advocacy/bigotry/bigotry.html", "self-advocacy/bigotry"),
    ("site/Self-Advocacy/disability/disability.html", "self-advocacy/disability"),
    ("site/Sex/sex.html", "sex"),
    ("site/Small-Core words/small-corewords.html", "small-and-core-words"),
    (
        "site/Small-Core words/pronouns/neopronouns.html",
        "small-and-core-words/pronouns/neopronouns",
    ),
    ("site/Small-Core words/pronouns/pronouns.html", "small-and-core-words/pronouns"),
    ("site/Small-Core words/so/so.html", "small-and-core-words/so"),
    ("site/Sports-Games/sports_games.html", "sports-and-games"),
    ("site/Sports-Games/MTG/mtg.html", "sports-and-games/magic-the-gathering"),
    (
        "site/Sports-Games/ttrpg/ttrpg.html",
        "sports-and-games/tabletop-roleplaying-games",
    ),
    ("site/Supports/braces.html", "supports/braces"),
    ("site/Supports/mobilityaids.html", "supports/mobility-aids"),
    ("site/Supports/supports.html", "supports"),
    ("site/Swearing/swearing.html", "swearing"),
    ("site/Tech/tech.html", "technology"),
    ("site/Time/time.html", "time"),
    ("site/Time/holidays/christmas.html", "time/holidays/christmas"),
    ("site/Time/holidays/holidays.html", "time/holidays"),
    ("site/Trauma-abuse/trauma-abuse.html", "trauma-and-abuse"),
]

by_pattern = re.compile(r"^\s*\|\s*(By )?(.+)", re.I)
and_pattern = re.compile(r"\[['\"](.+) (&|and) (.+)['\"]\]", re.I)
collab_pattern = re.compile(r"\['Collaboration by (.+), (.+)', '(.+)'\]", re.I)
adapted_by_pattern = re.compile(r"\[['\"](.+), adapted by (.+)['\"]\]", re.I)
adapted_from_pattern = re.compile(r"\[['\"](.+), adapted from (.+)['\"]\]", re.I)
adapted_from_pattern2 = re.compile(r"\[['\"](.+) \(adapted from (.+)\)['\"]\]", re.I)

with alive_bar(len(pages)) as bar:
    conn = sqlite3.connect("symbols.db")
    cursor = conn.cursor()

    for page_path, page_name in pages:

        with open(page_path, "r", encoding="utf-8") as f:
            soup = BeautifulSoup(f.read(), "html5lib")

        figures = soup.find_all("figure")

        for figure in figures:

            edit = False

            try:
                file = (
                    # figure.find("img")["src"].split("/")[-1].replace("%20", " ").strip()
                    figure.find("img")["src"]
                    .replace("%20", " ")
                    .strip()
                )
            except AttributeError:
                print("file failed")
                print(figure)
                exit()

            try:
                label = figure.find(
                    "span", attrs={"class": re.compile("^caption$", re.I)}
                ).text.strip()
            except AttributeError:
                print("label failed")
                print(figure)
                exit()

            try:
                artist = re.sub(
                    by_pattern,
                    r"['\2']",
                    figure.find(
                        "span", attrs={"class": re.compile("^credit$", re.I)}
                    ).text,
                ).replace(".", "")

                # check for collab
                if re.search(and_pattern, artist):
                    artist = re.sub(and_pattern, r"['\1', '\3']", artist)
                if re.search(collab_pattern, artist):
                    artist = re.sub(collab_pattern, r"['\1', '\2', '\3']", artist)
                    artist = re.sub(r"[()]", "", artist)

                # check for edit
                if re.search(adapted_by_pattern, artist):
                    artist = re.sub(adapted_by_pattern, r"['\1', '\2']", artist)
                    edit = True
                elif re.search(adapted_from_pattern, artist):
                    artist = re.sub(adapted_from_pattern, r"['\2', '\1']", artist)
                    edit = True
                elif re.search(adapted_from_pattern2, artist):
                    artist = re.sub(adapted_from_pattern2, r"['\2', '\1']", artist)
                    edit = True

            except AttributeError:
                print("artist failed")
                print(figure)
                exit()

            symbol = {
                "file": file,
                "pages": f"['{page_name}']",
                "label": label,
                "alt": figure.find("img")["alt"].strip(),
                "artist": artist,
                "credit": "by" if not edit else "edit",
            }

            try:
                cursor.execute(
                    "INSERT INTO symbols VALUES (:file, :pages, :label, :alt, :artist, :credit)",
                    symbol,
                )
            except sqlite3.IntegrityError:
                cursor.execute("SELECT * FROM symbols WHERE file = :file", symbol)
                result = eval(cursor.fetchall()[0][1])
                if not page_name in result:
                    result.append(page_name)
                    symbol["pages"] = str(result)
                    cursor.execute(
                        "UPDATE symbols SET pages = :pages WHERE file = :file", symbol
                    )

        bar()

    conn.commit()
