import csv
import itertools
import json

with open("test.json", 'r') as f:
    all_metadata = json.load(f)


def migrate_one(input_pathfrag, output_csvname):
    full_path = '../site' + input_pathfrag
    page_metadata = all_metadata[full_path]

    input_dir = output_csvname.rsplit('/', 1)[0] + '/'
    print(input_dir)

    output_csvname = "../site" + output_csvname

    # print(len(page_metadata))

    # Each page has either 3 or 6 columns
    # 0     1       2
    # |     |       |
    # v     v       v
    #
    # -- CW text, maybe --
    # 3     4       5
    # |     |       |
    # v     v       v

    img_cols = []
    for _ in range(6):
        img_cols.append([])

    # We want to rearrange the data in left-to-right order
    # by first splitting out into columns, and then interleaving
    for fig in page_metadata:
        (alt_text, url, caption, credit, col_i) = fig

        # Tidy up image URLs, preferring relative if possible
        if url.startswith(input_dir):
            url = url[len(input_dir):]

        img_cols[col_i].append((alt_text, url, caption, credit))
    main_section_figs = []
    cw_section_figs = []
    for x in itertools.zip_longest(img_cols[0], img_cols[1], img_cols[2]):
        for xx in x:
            if xx is not None:
                main_section_figs.append(xx)
    for x in itertools.zip_longest(img_cols[3], img_cols[4], img_cols[5]):
        for xx in x:
            if xx is not None:
                cw_section_figs.append(xx)
    # print(main_section_figs)
    # print(cw_section_figs)

    with open(output_csvname, 'w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=["Image URL", "Credit", "Caption", "Alt text"])
        writer.writeheader()

        for fig in main_section_figs:
            writer.writerow({
                "Image URL": fig[1],
                "Credit": fig[3],
                "Caption": fig[2],
                "Alt text": fig[0],
            })

        if cw_section_figs:
            writer.writerow({"Image URL": "----------"})
        for fig in cw_section_figs:
            writer.writerow({
                "Image URL": fig[1],
                "Credit": fig[3],
                "Caption": fig[2],
                "Alt text": fig[0],
            })


migrate_one("/AAC Org/aacorg.html", "/AAC Org/aacorg.csv")
migrate_one("/AAC Org/bodymedical/body medical folders.html", "/AAC Org/bodymedical/body medical folders.csv")
migrate_one("/AAC Org/conceptsfolders/concepts folders.html", "/AAC Org/conceptsfolders/concepts folders.csv")
migrate_one("/AAC Org/disabilityfolders/disability folders.html", "/AAC Org/disabilityfolders/disability folders.csv")
migrate_one("/AAC Org/letter folders/letterfolders.html", "/AAC Org/letter folders/letterfolders.csv")
migrate_one("/AAC Org/naturefolders/nature folders.html", "/AAC Org/naturefolders/nature folders.csv")
migrate_one("/AAC Org/people folders/peoplefolders.html", "/AAC Org/people folders/peoplefolders.csv")
migrate_one("/AAC Org/religionfolders/religion folders.html", "/AAC Org/religionfolders/religion folders.csv")
migrate_one("/AAC Org/templates/t.html", "/AAC Org/templates/templates.csv")
migrate_one("/AAC/aac.html", "/AAC/aac.csv")
migrate_one("/AAC/verbality/verbality.html", "/AAC/verbality/verbality.csv")
migrate_one("/Actions/ADLs.html", "/Actions/ADLs/ADLs.csv")
migrate_one("/Actions/ADLs/conditioning hair/ch.html", "/Actions/ADLs/conditioning hair/ch.csv")
migrate_one("/Actions/actions.html", "/Actions/actions.csv")
migrate_one("/Actions/cognitive/cognitive.html", "/Actions/cognitive/cognitive.csv")
migrate_one("/Actions/mobility.html", "/Actions/mobility/mobility.csv")
migrate_one("/Actions/sensing/sensing.html", "/Actions/sensing/sensing.csv")
migrate_one("/Actions/social/s.html", "/Actions/social/social.csv")
migrate_one("/Actions/stimming.html", "/Actions/stimming/stimming.csv")
migrate_one("/Actions/talking/talking.html", "/Actions/talking/talking.csv")
migrate_one("/Artscrafts/artscrafts.html", "/Artscrafts/artscrafts.csv")
migrate_one("/Body/body.html", "/Body/body.csv")
migrate_one("/Body/chest/chest.html", "/Body/chest/chest.csv")
migrate_one("/Body/facialfeatures.html", "/Body/facialfeatures/facialfeatures.csv")
migrate_one("/Body/genitalia/g.html", "/Body/genitalia/g.csv")
migrate_one("/Body/hair/hair.html", "/Body/hair/hair.csv")
migrate_one("/Body/menstruation/menstruation.html", "/Body/menstruation/menstruation.csv")
migrate_one("/Colours/colours.html", "/Colours/colours.csv")
migrate_one("/Concepts/alterhumanity/alterhumanity.html", "/Concepts/alterhumanity/alterhumanity.csv")
migrate_one("/Concepts/anthropology sociology/anthsoc.html", "/Concepts/anthropology sociology/anthsoc.csv")
migrate_one("/Concepts/astrology/astrology.html", "/Concepts/astrology/astrology.csv")
migrate_one("/Concepts/concepts.html", "/Concepts/concepts.csv")
migrate_one("/Concepts/physics/physics.html", "/Concepts/physics/physics.csv")
migrate_one("/Directions/directions.html", "/Directions/directions.csv")
migrate_one("/Disability/autism/a.html", "/Disability/autism/a.csv")
migrate_one("/Disability/delusion_hallucination/del_hal.html", "/Disability/delusion_hallucination/del_hal.csv")
migrate_one("/Disability/disability.html", "/Disability/disability.csv")
migrate_one("/Disability/orgs/organisations.html", "/Disability/orgs/organisations.csv")
migrate_one("/Disability/pd/pds.html", "/Disability/pd/pds.csv")
migrate_one("/Disability/plurality_system/plurality_system.html", "/Disability/plurality_system/plurality_system.csv")
migrate_one("/Disability/specific_disabilities.html", "/Disability/specific_disabilities/s.csv")
migrate_one("/Disability/s/paraphilia/paraphilia.html", "/Disability/specific_disabilities/paraphilia/paraphilia.csv")
migrate_one("/Disability/s/phobias/phobias.html", "/Disability/specific_disabilities/phobias/phobias.csv")
migrate_one("/Disability/s/tics/tics.html", "/Disability/specific_disabilities/tics/tics.csv")
migrate_one("/Disability/scoliosis/scoliosis.html", "/Disability/scoliosis/scoliosis.csv")
migrate_one("/Education/education.html", "/Education/education.csv")
migrate_one("/Education/generalscience.html", "/Education/sci/generalscience.csv")
migrate_one("/Education/math/math.html", "/Education/math/math.csv")
migrate_one("/Feelings/attraction/attraction.html", "/Feelings/attraction/attraction.csv")
migrate_one("/Feelings/empathy/empathy.html", "/Feelings/empathy/empathy.csv")
migrate_one("/Feelings/feelings.html", "/Feelings/feelings.csv")
migrate_one("/HR INR/IP/ip.html", "/HR INR/IP/ip.csv")
migrate_one("/HR INR/hrinr.html", "/HR INR/hrinr.csv")
migrate_one("/History/history.html", "/History/history.csv")
migrate_one("/Inflections/inflections.html", "/Inflections/inflections.csv")
migrate_one("/LBGT+/lbgtplus.html", "/LBGT+/lbgtplus.csv")
# Duplicate
# migrate_one("/LBGT+/lbgtplus1.html", "/LBGT+/lbgtplus1.csv")
migrate_one("/LBGT_/intersex/intersex.html", "/LBGT_/intersex/intersex.csv")
migrate_one("/LBGT_/lbgtplus.html", "/LBGT_/lbgtplus.csv")
# *NOT* a duplicate, but not linked from anywhere
# migrate_one("/LBGT_/lbgtplus1.html", "/LBGT_/lbgtplus1.csv")    # FIXME why are there two?
migrate_one("/Law/law.html", "/Law/law.csv")
migrate_one("/Law/laws/laws.html", "/Law/laws/laws.csv")
migrate_one("/Linguistics/glyphs/aurebesh/ab.html", "/Linguistics/glyphs/aurebesh/ab.csv")
migrate_one("/Linguistics/glyphs/ender/ender.html", "/Linguistics/glyphs/ender/ender.csv")
migrate_one("/Linguistics/glyphs/furthark/ef.html", "/Linguistics/glyphs/furthark/ef.csv")
migrate_one("/Linguistics/glyphs/greek/greek.html", "/Linguistics/glyphs/greek/greek.csv")
migrate_one("/Linguistics/glyphs/latin lc/latinlowercase.html", "/Linguistics/glyphs/latin lc/latinlowercase.csv")
migrate_one("/Linguistics/glyphs/latin uc/latinuppercase.html", "/Linguistics/glyphs/latin uc/latinuppercase.csv")
migrate_one("/Linguistics/glyphs/sitelen pona/sitelen.html", "/Linguistics/glyphs/sitelen pona/sitelen.csv")
migrate_one("/Linguistics/linguistics.html", "/Linguistics/linguistics.csv")
migrate_one("/MH/mh.html", "/MH/mh.csv")
migrate_one("/Media/Animal Crossing/ac.html", "/Media/Animal Crossing/ac.csv")
migrate_one("/Media/Bluey/bluey.html", "/Media/Bluey/bluey.csv")
migrate_one("/Media/Deltarune/deltarune.html", "/Media/Deltarune/deltarune.csv")
migrate_one("/Media/Minecraft/Minecraft.html", "/Media/Minecraft/Minecraft.csv")
migrate_one("/Media/Minecraft/cake/cake.html", "/Media/Minecraft/cake/cake.csv")
migrate_one("/Media/My Little Pony/mlp.html", "/Media/My Little Pony/mlp.csv")
migrate_one("/Media/Pokemon/pokemon.html", "/Media/Pokemon/pokemon.csv")
migrate_one("/Media/Sega/sonic.html", "/Media/Sega/sonic.csv")
migrate_one("/Media/Star Trek/StarTrek.html", "/Media/Star Trek/StarTrek.csv")
migrate_one("/Media/Star Wars/starwars.html", "/Media/Star Wars/starwars.csv")
migrate_one("/Media/TMA/tma.html", "/Media/TMA/tma.csv")
migrate_one("/Media/Transformers/transformers.html", "/Media/Transformers/transformers.csv")
migrate_one("/Media/Tropes/tropes.html", "/Media/Tropes/tropes.csv")
migrate_one("/Media/X Men/xmen.html", "/Media/X Men/xmen.csv")
migrate_one("/Media/media.html", "/Media/media.csv")
migrate_one("/Medical/allergy/allergies.html", "/Medical/allergy/allergies.csv")
migrate_one("/Medical/medical.html", "/Medical/medical.csv")
migrate_one("/Medical/medications/medications.html", "/Medical/medications/medications.csv")
migrate_one("/Medical/tumor/tumors.html", "/Medical/tumor/tumors.csv")
migrate_one("/Money/money.html", "/Money/money.csv")
migrate_one("/Natural Disaster/emergency.html", "/Natural Disaster/emergency.csv")
migrate_one("/Nature/animals.html", "/Nature/animals/animals.csv")
migrate_one("/Nature/animals/birds/birds.html", "/Nature/animals/birds/birds.csv")
migrate_one("/Nature/animals/bugs.html", "/Nature/animals/bugs/bugs.csv")
migrate_one("/Nature/animals/cats/cats.html", "/Nature/animals/cats/cats.csv")
migrate_one("/Nature/animals/parts/animal parts.html", "/Nature/animals/parts/animal parts.csv")
migrate_one("/Nature/astronomy.html", "/Nature/astro/astronomy.csv")
migrate_one("/Nature/elements/elements.html", "/Nature/elements/elements.csv")
migrate_one("/Nature/genetics/genetics.html", "/Nature/genetics/genetics.csv")
migrate_one("/Nature/nature.html", "/Nature/nature.csv")
migrate_one("/Nature/plants.html", "/Nature/plants/plants.csv")
migrate_one("/Nature/weather/weather.html", "/Nature/weather/weather.csv")
migrate_one("/Objects/accessories/accessories.html", "/Objects/accessories/accessories.csv")
migrate_one("/Objects/clothes/clothes.html", "/Objects/clothes/clothes.csv")
migrate_one("/Objects/food/dietaryrequirements.html", "/Objects/food/dq/dietaryrequirements.csv")
migrate_one("/Objects/food/drink.html", "/Objects/food/drink/drink.csv")
migrate_one("/Objects/food/food.html", "/Objects/food/food.csv")
migrate_one("/Objects/food/fruit.html", "/Objects/food/fruit/fruit.csv")
migrate_one("/Objects/food/seasoning/seasoning.html", "/Objects/food/seasoning/seasoning.csv")
migrate_one("/Objects/furniture/furniture.html", "/Objects/furniture/furniture.csv")
migrate_one("/Objects/objects.html", "/Objects/objects.csv")
migrate_one("/Objects/religion/buddhism/b.html", "/Objects/religion/buddhism/b.csv")
migrate_one("/Objects/religion/christianity.html", "/Objects/religion/c/christianity.csv")
migrate_one("/Objects/religion/folklore/folklore.html", "/Objects/religion/folklore/folklore.csv")
migrate_one("/Objects/religion/folklore/tarot/tarot.html", "/Objects/religion/folklore/tarot/tarot.csv")
migrate_one("/Objects/religion/islam.html", "/Objects/religion/i/islam.csv")
migrate_one("/Objects/religion/judaism.html", "/Objects/religion/j/judaism.csv")
migrate_one("/Objects/religion/paganism/paganism.html", "/Objects/religion/paganism/paganism.csv")
migrate_one("/Objects/religion/religion.html", "/Objects/religion/religion.csv")
migrate_one("/Objects/religious head coverings/headcoverings.html", "/Objects/religious head coverings/headcoverings.csv")
migrate_one("/Objects/soft toys/softtoys.html", "/Objects/soft toys/softtoys.csv")
migrate_one("/Objects/substances/substances.html", "/Objects/substances/substances.csv")
migrate_one("/Pain/charts levels/cl.html", "/Pain/charts levels/cl.csv")
migrate_one("/Pain/pain.html", "/Pain/pain.csv")
migrate_one("/Pain/parts/specific.html", "/Pain/parts/specific.csv")
migrate_one("/People/endearment/endearment.html", "/People/endearment/endearment.csv")
migrate_one("/People/nonspecific/nonspecificpeople.html", "/People/nonspecific/nonspecificpeople.csv")
migrate_one("/People/people.html", "/People/people.csv")
migrate_one("/People/r/relationships.html", "/People/r/relationships.csv")
migrate_one("/People/specific people/s_people.html", "/People/specific people/s_people.csv")
migrate_one("/Phrases/phrases.html", "/Phrases/phrases.csv")
migrate_one("/Places/countriesregions.html", "/Places/regions/countriesregions.csv")
migrate_one("/Places/mountains.html", "/Places/mountains/mountains.csv")
migrate_one("/Places/places.html", "/Places/places.csv")
migrate_one("/Punctuation/punctuation.html", "/Punctuation/punctuation.csv")
migrate_one("/Self-Advocacy/bigotry/bigotry.html", "/Self-Advocacy/bigotry/bigotry.csv")
migrate_one("/Self-Advocacy/disability/disability.html", "/Self-Advocacy/disability/disability.csv")
migrate_one("/Self-Advocacy/self-advocacy.html", "/Self-Advocacy/self-advocacy.csv")
migrate_one("/Sex/sex.html", "/Sex/sex.csv")
migrate_one("/Small-Core words/pronouns/neopronouns.html", "/Small-Core words/pronouns/neos/neopronouns.csv")
migrate_one("/Small-Core words/pronouns/pronouns.html", "/Small-Core words/pronouns/pronouns.csv")
migrate_one("/Small-Core words/small-corewords.html", "/Small-Core words/small-corewords.csv")
migrate_one("/Small-Core words/so/so.html", "/Small-Core words/so/so.csv")
migrate_one("/Sports-Games/MTG/mtg.html", "/Sports-Games/MTG/mtg.csv")
migrate_one("/Sports-Games/Ski/skiing.html", "/Sports-Games/Ski/skiing.csv")
migrate_one("/Sports-Games/sports_games.html", "/Sports-Games/sports_games.csv")
migrate_one("/Sports-Games/ttrpg/ttrpg.html", "/Sports-Games/ttrpg/ttrpg.csv")
migrate_one("/Supports/braces.html", "/Supports/braces/braces.csv")
migrate_one("/Supports/mobilityaids.html", "/Supports/mobility/mobilityaids.csv")
migrate_one("/Supports/supports.html", "/Supports/supports.csv")
migrate_one("/Swearing/swearing.html", "/Swearing/swearing.csv")
migrate_one("/Tech/tech.html", "/Tech/tech.csv")
migrate_one("/Time/holidays/christmas.html", "/Time/holidays/christmas/christmas.csv")
migrate_one("/Time/holidays/halloween.html", "/Time/holidays/halloween/halloween.csv")
migrate_one("/Time/holidays/holidays.html", "/Time/holidays/holidays.csv")
migrate_one("/Time/time.html", "/Time/time.csv")
migrate_one("/Trauma-abuse/trauma-abuse.html", "/Trauma-abuse/trauma-abuse.csv")
migrate_one("/description/description.html", "/description/description.csv")
migrate_one("/description/quantity/quantities.html", "/description/quantity/quantities.csv")
migrate_one("/description/sensory/sensory_description.html", "/description/sensory/sensory_description.csv")
