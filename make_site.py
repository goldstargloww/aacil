#!/usr/bin/env python3

from jinja2 import Environment, FileSystemLoader, select_autoescape
import csv
import glob
import grapheme
import os

# Get the directory this script is found in
REPO_ROOT = os.path.dirname(os.path.realpath(__file__))

# TODO: We should make this more user-friendly to edit
# Sometimes a subcategory is needed which doesn't match the folder tree
EXTRA_SUBCATEGORIES = {
    '/Body': [('/Nature/animals/parts/', 'animal parts')],
    '/Disability': [('/AAC/verbality/', 'verbality')],
    '/Education': [('/Concepts/anthropology sociology/', 'Anthropology & Sociology')],

    '/Linguistics': [
        ('/Linguistics/glyphs/latin lc/', 'lowercase latin letters (abcs)'),
        ('/Linguistics/glyphs/latin uc/', 'uppercase latin letters (ABCs)'),
        ('/Linguistics/glyphs/aurebesh/', 'aurebesh letters'),
        ('/Linguistics/glyphs/furthark/', 'the Elder Furthark'),
        ('/Linguistics/glyphs/ender/', 'Ender glyphs'),
        ('/Linguistics/glyphs/greek/', 'ancient Greek letters'),
        ('/Linguistics/glyphs/sitelen pona/', 'sitelen pona'),
    ],

    '/Media/Minecraft': [('/Linguistics/glyphs/ender/', 'Ender glyphs')],

    '/Nature': [('animals/bugs', 'Bugs')],

    '/Objects/clothes': [('/Objects/religious head coverings/', 'religious head coverings/')],
    '/Objects/food/dq': [('/Medical/allergy/', 'allergies')],
    '/Objects/religion': [('/Objects/religious head coverings/', 'religious head coverings/')],
}

# Anything listed here is renamed when displaying
# (Anything _not_ listed will display the folder name)
CATEGORY_FRIENDLY_NAMES = {
    ('', 'AAC Org'): "AAC organisation",
    ('', 'Actions'): "actions",
    ('', 'Artscrafts'): "arts & crafts",
    ('', 'Body'): "body",
    ('', 'Colours'): "colours",
    ('', 'Concepts'): "concepts",
    ('', 'Directions'): "directions",
    ('', 'Disability'): "disability",
    ('', 'Education'): "education",
    ('', 'Feelings'): "feelings",
    ('', 'History'): "history",
    ('', 'HR INR'): "human rights & international relations",
    ('', 'Inflections'): "inflections & tone",
    ('', 'Law'): "law & politics",
    ('', 'LBGT_'): "LBGTQIA+",
    ('', 'Linguistics'): "linguistics",
    ('', 'Media'): "media",
    ('', 'Medical'): "medical",
    ('', 'MH'): "mental health crisis & death",
    ('', 'Money'): "money",
    ('', 'Natural Disaster'): "natural disaster & emergency",
    ('', 'Nature'): "nature & animals",
    ('', 'Objects'): "objects",
    ('', 'Pain'): "pain",
    ('', 'People'): "people",
    ('', 'Phrases'): "phrases & social",
    ('', 'Places'): "places",
    ('', 'Punctuation'): "punctuation",
    ('', 'Self-Advocacy'): "self-advocacy",
    ('', 'Sex'): "sex",
    ('', 'Small-Core words'): "small / core words",
    ('', 'Sports-Games'): "sports & games",
    ('', 'Supports'): "supports",
    ('', 'Swearing'): "swearing",
    ('', 'Tech'): "technology",
    ('', 'Time'): "time",
    ('', 'Trauma-abuse'): "trauma & abuse",

    ('/AAC Org', 'bodymedical'): "body & medical folders",
    ('/AAC Org', 'conceptsfolders'): "concepts folders",
    ('/AAC Org', 'disabilityfolders'): "disability folders",
    ('/AAC Org', 'letter folders'): "letter folders",
    ('/AAC Org', 'naturefolders'): "nature & animals folders",
    ('/AAC Org', 'people folders'): "people folders",
    ('/AAC Org', 'religionfolders'): "religion folders",
    ('/AAC Org', 'templates'): "symbol templates",

    ('/Actions', 'ADLs'): "ADLs and iADLs",
    ('/Actions', 'talking'): "communicating",

    ('/Body', 'facialfeatures'): "facial features",
    ('/Body', 'chest'): "chests",

    ('/Concepts', 'alterhumanity'): "Alterhumanity, therianthropy, otherkin",
    ('/Concepts', 'anthropology sociology'): "Anthropology & Sociology",
    ('/Concepts', 'physics'): "Physics",
    ('/Concepts', 'astrology'): "Astrology",

    ('/description', 'quantity'): "quantities and sizes",
    ('/description', 'sensory'): "sensory description",

    ('/Disability', 'pd'): "personality disorders",
    ('/Disability', 'delusion_hallucination'): "delusions & hallucinations",
    ('/Disability', 'orgs'): "disability organisations",
    ('/Disability', 'plurality_system'): "plurality / systems",
    ('/Disability', 'specific_disabilities'): "specific disabilities / impairments",
    ('/Disability/specific_disabilities', 'tics'): "tics & Tourette",

    ('/Education', 'sci'): "general science",

    ('/Feelings', 'empathy'): "empathy & sympathy",

    ('/HR INR', 'IP'): "Israel and Palestine",

    ('/Law', 'laws'): "specific laws",

    ('/Media', 'Sega'): "Sega / Sonic",
    ('/Media', 'TMA'): "The Magnus Archives",
    ('/Media', 'Tropes'): "tropes",
    ('/Media/Minecraft', 'cake'): "minecraft-styled birthday cake",

    ('/Medical', 'tumor'): "tumors",
    ('/Medical', 'allergy'): "allergies",

    ('/Nature', 'plants'): "Plants",
    ('/Nature', 'elements'): "Elements",
    ('/Nature', 'animals'): "Animals",
    ('/Nature', 'weather'): "Weather",
    ('/Nature', 'genetics'): "Genetics",
    ('/Nature', 'astro'): "Astronomy",
    ('/Nature/animals', 'parts'): "animal parts",

    ('/Objects', 'religion'): "religion & folklore",
    ('/Objects/food', 'dq'): "dietary requirements",
    ('/Objects/religion', 'paganism'): "paganism & neopaganism",
    ('/Objects/religion', 'i'): "Islam",
    ('/Objects/religion', 'folklore'): "Folklore",
    ('/Objects/religion', 'buddhism'): "Buddhism",
    ('/Objects/religion', 'j'): "Judaism",
    ('/Objects/religion', 'c'): "Christianity",

    ('/Pain', 'charts levels'): "pain charts & pain levels",
    ('/Pain', 'parts'): "pain in specific body parts",

    ('/People', 'r'): "relationships",
    ('/People', 'nonspecific'): "nonspecific people / generic faces",

    ('/Places', 'regions'): "countries & regions",

    ('/Self-Advocacy', 'disability'): "disability self-advocacy",

    ('/Small-Core words/pronouns', 'neos'): "neopronouns",

    ('/Sports-Games', 'MTG'): "Magic: the Gathering",
    ('/Sports-Games', 'ttrpg'): "tabletop role-playing games",
    ('/Sports-Games', 'Ski'): "skiing",

    ('/Supports', 'mobility'): "mobility aids",
    ('/Supports', 'braces'): "braces & orthortics",

    ('/Time/holidays', 'halloween'): "Halloween",
    ('/Time/holidays', 'christmas'): "Christmas & Yule",
}

CATEGORY_ICONS = {
    '/AAC': "aac device with keyguard.png",
    '/AAC/verbality': "hyper verbal rae.png",
    '/AAC Org': "aac folder t.png",
    '/AAC Org/bodymedical': "../medical folder neon 2.png",
    '/AAC Org/conceptsfolders': "../concepts folder crows 1.png",
    '/AAC Org/disabilityfolders': "../disability folder t.png",
    '/AAC Org/letter folders': "Alphabet - A Black Thick.png",
    '/AAC Org/naturefolders': "../flowers folder crows 3.png",
    '/AAC Org/people folders': "../people folder petri 8.png",
    '/AAC Org/religionfolders': "../religion folder t.png",
    '/AAC Org/templates': "cube.png",
    '/Actions': "start to finish tt.png",
    '/Actions/cognitive': "i'm thinking.png",
    '/Actions/talking': "talk m.png",
    '/Actions/mobility': "walk with cane.png",
    '/Actions/sensing': "see tonto.png",
    '/Actions/social': "../meet ts.png",
    '/Actions/stimming': "fidget 2.png",
    '/Actions/ADLs': "feeding.png",
    '/Actions/ADLs/conditioning hair': "ch ls black.png",
    '/Artscrafts': "Arts And Crafts.png",
    '/Body': "leg 2.png",
    '/Body/chest': "chest 1ab.png",
    '/Body/facialfeatures': "../nose/nose ee.png",
    '/Body/hair': "../braids esrah.png",
    '/Body/menstruation': "pad.png",
    '/Colours': "colors cc.png",
    '/Concepts': "concept.png",
    '/Concepts/alterhumanity': "therian five guys.png",
    '/Concepts/anthropology sociology': "inquisitive observation.png",
    '/Concepts/astrology': "taurus.png",
    '/Concepts/physics': "atomic.png",
    '/description': "squishy neon.png",
    '/description/quantity': "../several pheonix.png",
    '/description/sensory': "../hot levi.png",
    '/Directions': "here.png",
    '/Disability': "disability stellar.png",
    '/Disability/delusion_hallucination': "hallucinating bh 2.png",
    '/Disability/pd': "../personality disorder vixen.png",
    '/Disability/plurality_system': "system sc.png",
    '/Disability/specific_disabilities': "../s/amputee 1.png",
    '/Disability/specific_disabilities/autism': "../../autism gold.png",
    '/Disability/specific_disabilities/paraphilia': "../../s/paraphilia/paraphilia chrome.png",
    '/Disability/specific_disabilities/phobias': "../../s/phobias/phobia m.png",
    '/Disability/specific_disabilities/scoliosis': "../../s/scoliosis.png",
    '/Education': "degree.png",
    '/Education/sci': "experimental group.png",
    '/Education/math': "pi.png",
    '/Feelings': "Excited stellar.png",
    '/Feelings/attraction': "../romantic attraction bh.png",
    '/Feelings/empathy': "empathy petri.png",
    '/Objects/food': "banana bread.png",
    '/Objects/food/dq': "../gluten free.png",
    '/Objects/food/drink': "../ice water.png",
    '/Objects/food/fruit': "../orange slice.png",
    '/Objects/food/seasoning': "spices.png",
    '/History': "../Concepts/history.png",
    '/HR INR': "united nations.png",
    '/HR INR/IP': "palestinian flag tonto.png",
    '/Law': "civil law.png",
    '/Law/laws': "ryan's rule.png",
    '/LBGT_': "/LBGT+/progress pride.png",
    '/LBGT_/intersex': "/LBGT+/intersex ani.png",
    '/Linguistics': "hungarian.png",
    '/Linguistics/glyphs/latin lc': "a_lc red 1.png",
    '/Linguistics/glyphs/latin uc': "a red 1.png",
    '/Linguistics/glyphs/aurebesh': "aurek.png",
    '/Linguistics/glyphs/furthark': "algiz 1.png",
    '/Linguistics/glyphs/ender': "ender a.png",
    '/Linguistics/glyphs/greek': "theta.png",
    '/Linguistics/glyphs/sitelen pona': "a sp.png",
    '/Media': "comic book.png",
    '/Media/My Little Pony': "earth pony.png",
    '/Media/Pokemon': "pokeball.png",
    '/Media/Sega': "classic sonic the hedgehog.png",
    '/Media/X Men': "professor x.png",
    '/Media/TMA': "the archivist gp 1.png",
    '/Media/Star Wars': "charas/Yoda 1.png",
    '/Media/Transformers': "transformers m.png",
    '/Media/Tropes': "van helsing hate crimes.png",
    '/Media/Deltarune': "deltarune ot.png",
    '/Media/Star Trek': "Starfleet 1.png",
    '/Media/Bluey': "bluey crows.png",
    '/Media/Minecraft': "blocks/grass block neon.png",
    '/Media/Animal Crossing': "gyroid.png",
    '/Medical': "emergency medical.png",
    '/Medical/allergy': "../serious latex allergy bh.png",
    '/Medical/medications': "../medicine crows.png",
    '/Medical/tumor': "benign tumor 2.png",
    '/MH': "suicidal neu.png",
    '/Money': "refund pheonix.png",
    '/Natural Disaster': "emergency stellar.png",
    '/Nature': "altitude.png",
    '/Nature/animals': "cat1.png",
    '/Nature/animals/parts': "face 5 guys.png",
    '/Nature/animals/birds': "../evening grosbeak.png",
    '/Nature/animals/cats': "../brown tabby cat budget.png",
    '/Nature/animals/bugs': "../snail petri.png",
    '/Nature/astro': "../constellation.png",
    '/Nature/elements': "1 hydrogen.png",
    '/Nature/genetics': "dna.png",
    '/Nature/plants': "../bush.png",
    '/Nature/weather': "../weather stellar.png",
    '/Objects': "folded towel blue.png",
    '/Objects/accessories': "Baseball cap.png",
    '/Objects/clothes': "tshirt talksense.png",
    '/Objects/furniture': "Bed stellar.png",
    '/Objects/religious head coverings': "niqab1.png",
    '/Objects/soft toys': "../teddy bear.png",
    '/Pain': "Pain-froggygolem.png",
    '/Pain/parts': "../back pain blackhole.png",
    '/Pain/charts levels': "Pain-chart-pastel-froggygolem.png",
    '/People': "people2.png",
    '/People/endearment': "sweetheart.png",
    '/People/nonspecific': "person m 2.png",
    '/People/r': "../my children tonto.png",
    '/People/specific people': "LLPSS.png",
    '/Phrases': "explain it like i'm 5 plum.png",
    '/Places': "parent's house.png",
    '/Places/regions': "../bahamas midi.png",
    '/Places/mountains': "../Mount_Lebanon_2.png",
    '/Punctuation': "percent.png",
    '/Objects/religion': "deity petri.png",
    '/Objects/religion/buddhism': "merit chan.png",
    '/Objects/religion/c': "gg cross.png",
    '/Objects/religion/i': "../islam green.png",
    '/Objects/religion/j': "../Judaism.png",
    '/Objects/religion/folklore': "green man.png",
    '/Objects/religion/paganism': "../folklore/pagan ee.png",
    '/Objects/religion/folklore/tarot': "cups koda.png",
    '/Self-Advocacy': "you're not listening to me.png",
    '/Self-Advocacy/bigotry': "fatphobia.png",
    '/Self-Advocacy/disability': "../disabled people need plastic straws tonto.png",
    '/Sex': "condom chrome.png",
    '/Small-Core words': "yes m.png",
    '/Small-Core words/pronouns': "They.png",
    '/Small-Core words/pronouns/neos': "../star 2.png",
    '/Sports-Games': "Soccer Ball.png",
    '/Sports-Games/MTG': "mtg card.png",
    '/Sports-Games/Ski': "ski pole legless rat.png",
    '/Sports-Games/ttrpg': "/Objects/dice.png",
    '/Objects/substances': "scheduled_substance.png",
    '/Supports': "carer.png",
    '/Supports/braces': "../afo brace 3.png",
    '/Supports/mobility': "../active_wheelchair_1.png",
    '/Swearing': "bullshit vixen 4.png",
    '/Tech': "laptop computer stellar.png",
    '/Time': "running early vixen.png",
    '/Time/holidays': "indigenous peoples day koda.png",
    '/Time/holidays/christmas': "/Objects/religion/santa claus tonto.png",
    '/Time/holidays/halloween': "../trick or treating bh.png",
    '/Trauma-abuse': "intergenerational trauma 2.png",

}

CW_TEXT = {
    '/Body/menstruation': "Below are symbols with blood:",
    '/Disability/plurality_system': "the following symbols represent opinions and may be upsetting",
    '/LBGT_': "high-contrast symbols below",
    '/LBGT_/intersex': "Warning: the symbols below depict intersexism and IGM",
    '/Medical': "pictures with needles below",
    '/Objects/substances': "pictures with needles below",
    '/Small-Core words': "high contrast symbols below",
}

CW_CATEGORY = {
    '/MH': '/warning.html',
    '/Sex': '/Sex/warning.html',
    '/Swearing': '/Swearing/swear_warning.html',
}

MAIN_PAGE_EXTRA_CATEGORIES = [
    ('/Objects/food', "food"),
    ('/Objects/religion', "religion & folklore"),
    ('/Objects/substances', "substances"),
]


def find_all_csv_files():
    return glob.glob(f'{REPO_ROOT}/site/**/*.csv', recursive=True)


def collect_categories(all_csv_files):
    cat_tree = {}

    for csv_file in all_csv_files:
        remove_prefix = f'{REPO_ROOT}/site'
        assert csv_file.startswith(remove_prefix)
        csv_file_name = csv_file[len(remove_prefix):]

        # This is the path the CSV file is in,
        # e.g. /AAC Org/aacorg.csv --> /AAC Org
        this_cat_path = os.path.dirname(csv_file_name)

        # Remove leading / and split into segments
        assert this_cat_path.startswith('/')
        this_cat_path = this_cat_path[1:].split('/')

        cat_tree_walk = cat_tree
        # Make sure each segment is defined in the tree
        for path_seg in this_cat_path:
            if path_seg not in cat_tree_walk:
                cat_tree_walk[path_seg] = {}
            cat_tree_walk = cat_tree_walk[path_seg]

    return cat_tree


def generate_one_page(all_syms, csv_filename, category_tree, template):
    # Get the URL for looking up subcategories
    remove_prefix = f'{REPO_ROOT}/site'
    assert csv_filename.startswith(remove_prefix)
    this_cat = os.path.dirname(csv_filename[len(remove_prefix):])

    # Look up the subcategories
    assert this_cat.startswith('/')
    this_cat_path = this_cat[1:].split('/')
    subcategories = category_tree
    for path_seg in this_cat_path:
        subcategories = subcategories[path_seg]
    subcategories = list(subcategories)

    # Get the human-friendly subcategory names
    subcat_names = []
    for subcat in subcategories:
        if (this_cat, subcat) in CATEGORY_FRIENDLY_NAMES:
            subcat_names.append(CATEGORY_FRIENDLY_NAMES[this_cat, subcat])
        else:
            subcat_names.append(subcat)

    # Get the _extra_ subcategories
    if this_cat in EXTRA_SUBCATEGORIES:
        for (extra_cat_url, extra_cat_text) in EXTRA_SUBCATEGORIES[this_cat]:
            subcategories.append(extra_cat_url)
            subcat_names.append(extra_cat_text)

    # Load CSV
    figs = []
    figs_with_cw = []
    current_figs = figs
    with open(csv_filename, 'r', newline='') as f:
        reader = csv.DictReader(f)
        for row in reader:
            # This marks the separation with CWed items
            if row["Image URL"] == '----------':
                current_figs = figs_with_cw
                continue

            # Resolve the URL appropriately
            url = row["Image URL"]
            if not url.startswith('/'):
                url = this_cat+'/'+url

            # Keep track of information, for "all symbols" list
            if url not in all_syms:
                all_syms[url] = set()
            all_syms[url].add(row["Caption"])

            current_figs.append(row)

    # .csv -> index.html
    html_filename = os.path.dirname(csv_filename) + '/index.html'

    if this_cat == '/Media':
        # SPECIAL: handle icons on /Media
        data_for_page = [{
            "url": subcategories[i],
            "text": subcat_names[i],
            "icon": subcategories[i]+'/'+CATEGORY_ICONS[this_cat+'/'+subcategories[i]],
        } for i in range(len(subcategories))]
    else:
        data_for_page = [{
            "url": subcategories[i],
            "text": subcat_names[i],
        } for i in range(len(subcategories))]

    # SPECIAL: Handle CWs
    if figs_with_cw:
        cw_text = CW_TEXT[this_cat]
    else:
        cw_text = ""

    # Actually make the output
    subcats = sorted(data_for_page, key=lambda x: x["text"])
    rendered = template.render(
        figs=figs,
        figs_with_cw=figs_with_cw,
        subcats=subcats,
        cw_text=cw_text,
    )
    with open(html_filename, 'w') as f:
        f.write(rendered)


def main():
    jinja_env = Environment(
        loader=FileSystemLoader(REPO_ROOT + '/templates'),
        autoescape=select_autoescape(),
    )
    category_template = jinja_env.get_template("category.html")

    all_csvs = find_all_csv_files()
    category_tree = collect_categories(all_csvs)
    all_syms = {}
    for csv_file in all_csvs:
        generate_one_page(all_syms, csv_file, category_tree, category_template)

    # Generate "all symbols" page
    # all_syms is currently a map of URLs to a *set* of captions, so flatten it
    all_syms_flattened = []
    for (url, captions) in all_syms.items():
        for caption in captions:
            all_syms_flattened.append((url, caption))
    all_syms_flattened.sort(key=lambda x: (x[1].upper(), x[0]))
    # print(all_syms_flattened)
    all_sym_first_letters = []
    all_syms_by_letter = {}
    for (url, caption) in all_syms_flattened:
        first_letter = grapheme.graphemes(caption).__next__()
        first_letter = first_letter.upper()
        if first_letter not in all_syms_by_letter:
            all_sym_first_letters.append(first_letter)
            all_syms_by_letter[first_letter] = []
        all_syms_by_letter[first_letter].append({
            "url": url,
            "caption": caption,
        })

    all_syms_template = jinja_env.get_template("list.html")
    with open(f'{REPO_ROOT}/site/list.html', 'w') as f:
        rendered = all_syms_template.render(
            sym_first_letters=all_sym_first_letters,
            syms_by_letter=all_syms_by_letter,
        )
        f.write(rendered)

    # Generate category map page
    def reformat_sitemap_subtree(category_node, path_so_far='/'):
        ret = []
        for (subcat, subcat_node) in category_node.items():
            node = {
                "url": f'{path_so_far}{subcat}/'
            }

            # Look up the icon
            if node["url"][:-1] in CATEGORY_ICONS:
                icon = CATEGORY_ICONS[node["url"][:-1]]
                if not icon.startswith('/'):
                    node["icon"] = node["url"] + icon
                else:
                    node["icon"] = icon

            # SPECIAL: Categories that have a blanket CW
            if node["url"][:-1] in CW_CATEGORY:
                node["url"] = CW_CATEGORY[node["url"][:-1]]

            # Look up the nice name
            assert path_so_far.endswith('/')
            if (path_so_far[:-1], subcat) in CATEGORY_FRIENDLY_NAMES:
                node["desc"] = CATEGORY_FRIENDLY_NAMES[(path_so_far[:-1], subcat)]
            else:
                node["desc"] = subcat

            # Do recursion
            if subcat_node:
                node["children"] = reformat_sitemap_subtree(subcat_node, node["url"])
            ret.append(node)
        ret.sort(key=lambda x: x["desc"].upper())
        return ret
    sitemap_data = reformat_sitemap_subtree(category_tree)

    sitemap_template = jinja_env.get_template("map.html")
    with open(f'{REPO_ROOT}/site/map.html', 'w') as f:
        rendered = sitemap_template.render(sitemap_data=sitemap_data)
        f.write(rendered)

    # Generate main page
    mainpage_categories = [{
        "url": x["url"],
        "desc": x["desc"],
    } for x in sitemap_data]
    for x in MAIN_PAGE_EXTRA_CATEGORIES:
        mainpage_categories.append({
            "url": x[0],
            "desc": x[1],
        })
    mainpage_categories.sort(key=lambda x: x["desc"].upper())

    mainpage_template = jinja_env.get_template("index.html")
    with open(f'{REPO_ROOT}/site/index.html', 'w') as f:
        rendered = mainpage_template.render(categories=mainpage_categories)
        f.write(rendered)


if __name__ == '__main__':
    main()
