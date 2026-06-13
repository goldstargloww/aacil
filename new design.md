# Important features

- symbols
  - caption
  - alt text
  - creator (can be complex, see below)
  - filename
  - category (can be in multiple at once, currently can have different metadata, ideally should not)

  - CW (on page) (should support multiple CWs/page, currently doesn't)

- category
  - name to display
  - representative icon image
  - location (can show up in multiple places, need to prevent infinite loops)

  - CW (interstitial)

- artist/creator
  - can be simple
  - can be a collab
  - can be a redraw/derivative

  - display only one level? don't recurse?
    - By X
    - By X, Y, & Z
    - By X, adapted from Y
    - By X & Y, adapted from Z
    - By X & Y, adapted from Z & W

# Resulting database schema

## page CWs

- **ID** (PK)
- text

## symbols

- **ID** (PK)
- filename (unique)
- caption
- alt text
- CW (FK)

## artists

- **ID** (PK)
- display name
- name disclaimer (optional, for front page)
- name extra (optional, for front page)

## symbol artists

- Symbol ID (FK)
- Artist ID (FK)

can have multiple entries with the same symbol ID, to indicate a collab

## symbol adapted from

- Symbol ID (FK)
- Artist ID (FK)

only exists if an adaptation

FIXME: Do we want to track _which_ image it's adapted from?

## category

- **ID** (PK)
- name to display
- name on filesystem and in URLs
- icon (FK, optional)
- CW (optional)

## symbols in category

- Category ID (FK)
- Symbol ID (FK)
- override caption (e.g. for noun vs adjective)

this allows many-to-many relationships

NOTE: This doesn't allow manual sort order

## subcategories

- Parent category ID (FK)
- Subcategory ID (FK)

this allows many-to-many relationships

cycle prevention must be implemented at the application layer

database must _always_ be acyclic:

- page building doesn't check for cycles
- adding a totally-new subcategory cannot possibly create a cycle
- adding a copy of a category (child) under an existing category (parent) has to check for cycles, but it only has to DFS from the _child_, checking against the current path

## suppress image CWs on category

- Category ID (FK)
- CW ID (FK)

e.g. this is used for the "bigotry" page so that it doesn't show CWs related to bigotry, but when those symbols show up on other pages it will be in a CW section

# Site generation

site persistent state is stored as CSV exports of DB contents, which allows easier diffing and inspection. site data is dynamically imported into in-memory sqlite databases

we really want _one_ programming language, so probably all JS

intermediate stage: npm runs in CI/CD to generate pages statically, including frontend SPA. frontend SPA also can load CSVs into database, allowing edits. edits result in a download export of new CSVs. uploading changes to git is manual

later: upload changes to git via API
