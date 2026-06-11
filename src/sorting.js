export function sort_artists(a, b) {
    a = a.display.toUpperCase();
    b = b.display.toUpperCase();

    // Deal with removing "The "
    if (a.startsWith("THE "))
        a = a.slice(4);
    if (b.startsWith("THE "))
        b = b.slice(4);

    return a.localeCompare(b);
}
