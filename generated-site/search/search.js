let symbols = [];

const labelSearch = document.getElementById("labelSearch");
const artistSearch = document.getElementById("artistSearch");

fetch("/symbols.json")
    .then((response) => response.json())
    .then((data) => {
        symbols = data;

        // search if either of the search boxes were already filled
        // (eg. on reload)
        if (
            labelSearch.value.trim() !== "" ||
            artistSearch.value.trim() !== ""
        ) {
            searchSymbols();
        }
    });

function debounce(func, delay) {
    // delay for a little after calling the function so it doesn't do it every keystroke
    let timeout;
    return function (...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), delay);
    };
}

function removeDiacritics(text) {
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function searchSymbols() {
    const labelQuery = removeDiacritics(labelSearch.value.trim().toLowerCase());
    const artistQuery = removeDiacritics(
        artistSearch.value.trim().toLowerCase()
    );

    if (labelQuery === "" && artistQuery === "") {
        const resultsList = document.getElementById("results");
        resultsList.innerHTML = "";
        return;
    }

    const results = symbols.filter((symbol) => {
        const labelMatch =
            labelQuery === "" ||
            removeDiacritics(symbol.label.toLowerCase()).includes(labelQuery);
        const artistMatch =
            artistQuery === "" ||
            symbol.artists.some((artist) =>
                removeDiacritics(artist.toLowerCase()).includes(artistQuery)
            );
        return labelMatch && artistMatch;
    });

    const resultsList = document.getElementById("results");
    resultsList.innerHTML = results
        .map(
            (symbol) => `
            <figure>
                <img alt="${symbol.alt}" src="/assets/symbols/${symbol.file
                .split("/")
                .slice(-1)}">
                <figcaption>
                    <div>
                        <span class="caption">${symbol.label}</span>
                        <span class="credit">${symbol.artist_string}</span>
                    </div>
                </figcaption>
            </figure>
        `
        )
        .join("");
}

const debouncedSearch = debounce(searchSymbols, 300); // milliseconds
labelSearch.addEventListener("input", debouncedSearch);
artistSearch.addEventListener("input", debouncedSearch);
