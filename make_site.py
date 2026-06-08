#!/usr/bin/env python3

from jinja2 import Environment, FileSystemLoader, select_autoescape
import csv
import glob
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

    '/Nature': [('animals/bugs', 'Bugs')],

    '/Objects/clothes': [('/Objects/religious head coverings/', 'religious head coverings/')],
    '/Objects/food/dq': [('/Medical/allergy/', 'allergies')],
    '/Objects/religion': [('/Objects/religious head coverings/', 'religious head coverings/')],
}

# Anything listed here is renamed when displaying
# (Anything _not_ listed will display the folder name)
SUBCATEGORY_FRIENDLY_NAMES = {
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

    # FIXME
    # ('/Media', 'My Little Pony'): "",
    # ('/Media', 'Pokemon'): "",
    # ('/Media', 'Sega'): "",
    # ('/Media', 'X Men'): "",
    # ('/Media', 'TMA'): "",
    # ('/Media', 'Star Wars'): "",
    # ('/Media', 'Transformers'): "",
    # ('/Media', 'Tropes'): "",
    # ('/Media', 'Deltarune'): "",
    # ('/Media', 'Star Trek'): "",
    # ('/Media', 'Bluey'): "",
    # ('/Media', 'Minecraft'): "",
    # ('/Media', 'Animal Crossing'): "",
    # ('/Media/Minecraft', 'cake'): "",

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


def find_all_csv_files():
    return glob.glob(f'{REPO_ROOT}/site/**/*.csv', recursive=True)


def collect_subcategories(all_csv_files):
    subcategories = {}

    for csv_file in all_csv_files:
        remove_prefix = f'{REPO_ROOT}/site'
        assert csv_file.startswith(remove_prefix)
        csv_file_name = csv_file[len(remove_prefix):]

        # This is the path the CSV file is in,
        # e.g. /AAC Org/aacorg.csv --> /AAC Org
        containing_dir_name = os.path.dirname(csv_file_name)
        # This is one level further up,
        # e.g. /AAC Org/aacorg.csv --> /AAC Org --> /
        parent_dir_name = os.path.dirname(containing_dir_name)
        # The name of just this category by itself
        # e.g. /AAC Org/aacorg.csv --> /AAC Org --> AAC Org
        this_category_name = os.path.basename(containing_dir_name)
        # Make sure it was all correct
        assert this_category_name
        if parent_dir_name == '/':
            assert containing_dir_name == '/'+this_category_name
        else:
            assert containing_dir_name == parent_dir_name \
                + '/'+this_category_name

        if parent_dir_name not in subcategories:
            subcategories[parent_dir_name] = []
        subcategories[parent_dir_name].append(this_category_name)

    return subcategories


def generate_one_page(csv_filename, all_subcategories, template):
    # Get the URL for looking up subcategories
    remove_prefix = f'{REPO_ROOT}/site'
    assert csv_filename.startswith(remove_prefix)
    this_cat = os.path.dirname(csv_filename[len(remove_prefix):])

    # Look up the subcategories
    if this_cat in all_subcategories:
        subcategories = all_subcategories[this_cat]
        # print(this_cat, subcategories)
    else:
        subcategories = []

    # Get the human-friendly subcategory names
    subcat_names = []
    for subcat in subcategories:
        if (this_cat, subcat) in SUBCATEGORY_FRIENDLY_NAMES:
            subcat_names.append(SUBCATEGORY_FRIENDLY_NAMES[this_cat, subcat])
        else:
            subcat_names.append(subcat)

    # Get the _extra_ subcategories
    if this_cat in EXTRA_SUBCATEGORIES:
        for (extra_cat_url, extra_cat_text) in EXTRA_SUBCATEGORIES[this_cat]:
            subcategories.append(extra_cat_url)
            subcat_names.append(extra_cat_text)

    # Load CSV
    with open(csv_filename, 'r', newline='') as f:
        reader = csv.DictReader(f)
        figs = list(reader)

    # .csv -> index.html
    html_filename = os.path.dirname(csv_filename) + '/index.html'

    # Actually make the output
    subcats = sorted(zip(subcategories, subcat_names), key=lambda x: x[1])
    rendered = template.render(figs=figs, subcats=subcats)
    with open(html_filename, 'w') as f:
        f.write(rendered)


def main():
    jinja_env = Environment(
        loader=FileSystemLoader(REPO_ROOT + '/templates'),
        autoescape=select_autoescape(),
    )
    category_template = jinja_env.get_template("category.html")

    all_csvs = find_all_csv_files()
    subcategories = collect_subcategories(all_csvs)
    for csv_file in all_csvs:
        generate_one_page(csv_file, subcategories, category_template)


if __name__ == '__main__':
    main()
