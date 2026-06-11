export function sort_artists(a, b) {
    a = String(a.display).toUpperCase();
    b = String(b.display).toUpperCase();

    // Deal with removing "The "
    if (a.startsWith("THE "))
        a = a.slice(4);
    if (b.startsWith("THE "))
        b = b.slice(4);

    return a.localeCompare(b);
}

export function sort_sym_cw(a, b) {
    a = String(a.text).toUpperCase();
    b = String(b.text).toUpperCase();

    return a.localeCompare(b);
}

export function sort_categories(a, b) {
    a = String(a.desc).toUpperCase();
    b = String(b.desc).toUpperCase();

    return a.localeCompare(b);
}
