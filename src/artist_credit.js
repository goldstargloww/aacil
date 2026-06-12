export function lookup_artist_credits(database, img_id) {
    let artist_credits = [];
    database.exec(`
        select artists.display from artists
        join sym_artists on sym_artists.artist_id = artists.id
        where sym_artists.img_id=?`, {
        bind: [img_id],
        resultRows: artist_credits
    });
    artist_credits = artist_credits.map((x) => x[0]);
    artist_credits.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

    let artist_derived_from_credits = [];
    database.exec(`
        select artists.display from artists
        join sym_derived_from on sym_derived_from.artist_id = artists.id
        where sym_derived_from.img_id=?`, {
        bind: [img_id],
        resultRows: artist_derived_from_credits
    });
    artist_derived_from_credits = artist_derived_from_credits.map((x) => x[0]);
    artist_derived_from_credits.sort((a, b) => a.toUpperCase().localeCompare(b.toUpperCase()));

    // Make it pretty
    if (artist_credits.length === 0) {
        console.warn(`${img_id} ${sym.filename} doesn't have artist credits`);
        artist_credits = "<unknown>";
    } else {
        artist_credits = artist_credits.join(" & ");
    }

    if (artist_derived_from_credits.length > 0) {
        artist_derived_from_credits = artist_derived_from_credits.join(" & ");
        artist_credits += `, adapted from ${artist_derived_from_credits}`;
    }
    return artist_credits;
}
