import csv
import glob
import os

# Get the directory this script is found in
REPO_ROOT = os.path.dirname(os.path.realpath(__file__))

all_csvs = glob.glob(f'{REPO_ROOT}/../site/**/*.csv', recursive=True)
remove_prefix = f'{REPO_ROOT}/../site'

img_to_id = {}
with open('site/database/images.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        img_to_id[row['filename']] = row['id']

id_to_artist = {}
artist_to_id = {}
with open('site/database/artists.csv', 'r') as f:
    reader = csv.DictReader(f)
    for row in reader:
        artist_to_id[row['display'].lower()] = row['id']
        id_to_artist[row['id']] = row['display']


def A(x):
    return artist_to_id[x.lower()]


MANUAL_ARTIST_REMAPPING = {
    'Esran': ([A('Esrah')], []),
    'M and Petri': ([A('M'), A('Petri')], []),
    'Petri & M': ([A('M'), A('Petri')], []),
    'Petri & Neon': ([A('Neon'), A('Petri')], []),
    'Petri & Gillipop': ([A('Gillipop'), A('Petri')], []),
    'M & StellarSymbol': ([A('M'), A('StellarSymbols')], []),
    'M & StellarSymbols': ([A('M'), A('StellarSymbols')], []),
    'M & Neon': ([A('M'), A('Neon')], []),
    'M & Vixen': ([A('M'), A('Vixen')], []),
    'Koda': ([A('kodabearsaac')], []),
    'Aok AAC': ([A('aok-aac')], []),
    'Rae and Ani': ([A('Rae'), A('Ani')], []),
    'Avery and Pheonix': ([A('Avery'),  A('Pheonix')], []),
    'Harlow': ([A('disabledfox')], []),
    'Nonspeaking Kiku': ([A('NonspeakingKiku')], []),
    'K9': ([A('K9Emote')], []),
    'Eldrith-Emojis': ([A('Eldritch-Emojis')], []),
    'Eldritch-Emoji': ([A('Eldritch-Emojis')], []),
    'pandora’s box': ([A('pandora\'s box')], []),
    'pandora\'s-box': ([A('pandora\'s box')], []),
    'Dusty, adapted by M': ([A('M')], [A('Dusty')]),
    'StellarSymbols, adapted by M': ([A('M')], [A('StellarSymbols')]),
    'Blackholemojis, adapted by M': ([A('M')], [A('Blackholemojis')]),
    'M, adapted from Blackholemojis': ([A('M')], [A('Blackholemojis')]),
    'Petri, adapted by M': ([A('M')], [A('Petri')]),
    'Fractals, adapted by M': ([A('M')], [A('Fractals')]),
    'cytochrome-sea, adapted by M': ([A('M')], [A('cytochrome-sea')]),
    'Petri (adapted by M)': ([A('M')], [A('Petri')]),
    'Neon & Rae': ([A('Neon'), A('Rae')], []),
    'Neon & Gillipop': ([A('Neon'), A('Gillipop')], []),
    'Neon & M': ([A('Neon'), A('M')], []),
    'Stellar-Symbols': ([A('StellarSymbols')], []),
    'M, adapted by Gillipop': ([A('Gillipop')], [A('M')]),
    'M, adapted by Dusty': ([A('Dusty')], [A('M')]),
    'legless-rat': ([A('legless rat')], []),
    'blackholemojs': ([A('Blackholemojis')], []),
    'Blackholemoji': ([A('Blackholemojis')], []),
    'TBy alkSense': ([A('TalkSense')], []),
    'Stellar': ([A('StellarSymbols')], []),
    'StelarSymbols': ([A('StellarSymbols')], []),
    'Takara Moon': ([A('takaramoon')], []),
    'Meowing': ([A('meowing-emojis')], []),
    'Vixen & M': ([A('Vixen'), A('M')], []),
    'TCC': ([A('TCC-mojis')], []),
    'K9Emotes': ([A('K9Emote')], []),
    'Gillipop, adapted from froggygolem': ([A('Gillipop')], [A('froggygolem')]),
    'Petri, adapted by Pheonix': ([A('Pheonix')], [A('Petri')]),
    'Petri, adapted by CC': ([A('CC')], [A('Petri')]),
    'Petri, adapted by Neon': ([A('Neon')], [A('Petri')]),
    'Zaza': ([A('zaza-art')], []),
    'frogygolem': ([A('froggygolem')], []),
    'froggygolem_': ([A('froggygolem')], []),
    'Fractals & M': ([A('Fractals'), A('M')], []),
    'Meabh': ([A('Méabh')], []),
    'M (adapted from StellarSymbols)': ([A('M')], [A('StellarSymbols')]),
    'M, adapted from Plum': ([A('M')], [A('Plum')]),
    'M, adapted from Petri': ([A('M')], [A('Petri')]),
    'meowing': ([A('meowing-emojis')], []),
    'lovelikeadog': ([A('Loveelikeadog')], []),
    'Lovelikeadog': ([A('Loveelikeadog')], []),
    'Insert-name-here': ([A('InsertNameHere')], []),
    'Insert-Name-Here': ([A('InsertNameHere')], []),
    'Pi & M': ([A('Pi'), A('M')], []),
    'CC & M': ([A('CC'), A('M')], []),
    'Collaboration by Froggygolem, Ani, & M)': ([A('froggygolem'), A('Ani'), A('M')], []),
    'Pheonix & Plum': ([A('Pheonix'), A('Plum')], []),
    'Eldritch-Emojis (adapted from Esrah)': ([A('Eldritch-Emojis')], [A('Esrah')]),
    'ArsonCrows': ([A('Crows')], []),
    'CC, adapted by Wolf': ([A('Wolf')], [A('CC')]),
    'CC, modified by Wolf': ([A('Wolf')], [A('CC')]),
    'Rylan, adapted from CC': ([A('Rylan')], [A('CC')]),
    'Chan, adapted from CC': ([A('Chan')], [A('CC')]),
    'M, adapted from CC': ([A('M')], [A('CC')]),
    'StellarSymbols & Neon': ([A('StellarSymbols'), A('Neon')], []),
    'Crows & Ottertime': ([A('Crows'), A('Ottertime')], []),
    'Petri, modified by M': ([A('M')], [A('Petri')]),
    'Nubs & Neon': ([A('Nubs'), A('Neon')], []),
    'legless rat, adapted from Crows': ([A('legless rat')], [A('Crows')]),
    'Avery and Phoenix': ([A('Avery'), A('Phoenix')], []),
    'Gillipop & StellarSymbol': ([A('Gillipop'), A('StellarSymbols')], []),
    'Gillipop & StellarSymbols': ([A('Gillipop'), A('StellarSymbols')], []),
    'froggygolem, adapted by goldstargloww': ([A('goldstargloww')], [A('froggygolem')]),
    'Plum, adapted by Rayin': ([A('Rayin')], [A('Plum')]),
    'Neon, adapted from froggygolem': ([A('neon')], [A('froggygolem')]),
    'Plum & Gillipop': ([A('Plum'), A('Gillipop')], []),
}

all_artists_human_verify_check = list(MANUAL_ARTIST_REMAPPING.items())
all_artists_human_verify_check.sort(key=lambda x: x[0].lower())
for (string, (artist_credits, derived_credits)) in all_artists_human_verify_check:
    artist_credits = [id_to_artist[x] for x in artist_credits]
    derived_credits = [id_to_artist[x] for x in derived_credits]
    artist_credits.sort(key=lambda x: x.lower())
    derived_credits.sort(key=lambda x: x.lower())

    artist_credits = ' & '.join(artist_credits)
    if derived_credits:
        derived_credits = ", adapted from " + ' & '.join(derived_credits)
    else:
        derived_credits = ''

    print(string)
    print(artist_credits + derived_credits)
    print("---------")


artist_credits = []
derived_credits = []
visited_images = set()
for csv_filename in all_csvs:
    assert csv_filename.startswith(remove_prefix)
    this_cat = os.path.dirname(csv_filename[len(remove_prefix):])
    # print(this_cat)

    if this_cat == '/database':
        continue

    with open(csv_filename, 'r', newline='') as fr:
        reader = csv.DictReader(fr)
        for row in reader:
            img_filename = row["Image URL"]

            if row["Image URL"] == '----------':
                continue

            if not img_filename.startswith('/'):
                img_filename = this_cat + '/' + img_filename
            img_filename = os.path.normpath(img_filename)
            # print(img_filename)

            if img_filename in visited_images:
                continue

            assert os.path.exists(f'{REPO_ROOT}/../site{img_filename}')

            credit = row["Credit"]

            img_id = img_to_id[img_filename]

            if credit.lower() in artist_to_id:
                artist_id = [artist_to_id[credit.lower()]]
                derived_id = []
            else:
                (artist_id, derived_id) = MANUAL_ARTIST_REMAPPING[credit]

            # if derived_id:
            #     print(img_filename, credit)

            for x in artist_id:
                artist_credits.append({
                    "img_id": img_id,
                    "artist_id": x
                })

            for x in derived_id:
                derived_credits.append({
                    "img_id": img_id,
                    "artist_id": x
                })
            
            visited_images.add(img_filename)

# print(artist_credits, derived_credits)
artist_credits.sort(key=lambda x: (x["img_id"], x["artist_id"]))
derived_credits.sort(key=lambda x: (x["img_id"], x["artist_id"]))

with open('sym_artists.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['img_id', 'artist_id'])
    writer.writeheader()
    for x in artist_credits:
        writer.writerow(x)

with open('sym_derived_from.csv', 'w') as f:
    writer = csv.DictWriter(f, fieldnames=['img_id', 'artist_id'])
    writer.writeheader()
    for x in derived_credits:
        writer.writerow(x)
