/*
var searchbox = document.getElementById("searchbox");
var resultsList = document.getElementById("searchUL");


let searchterm = "";
function filterLines(lines) {
    searchterm = searchbox.value;
    filteredLines = lines.filter(x => x[1].toLowerCase().includes(searchterm.toLowerCase()));
    return filteredLines
}

searchbox.onkeyup = function() {
    let filteredLines = filterLines(allLines);
    modifyResultsList(filteredLines);
    if (filteredLines.length == 0 && !resultsList.classList.contains("hidden")) {
        toggleElementVisibility(resultsList)
    }
}
    */

let db;

initSqlJs({
    locateFile: (file) => `/${file}`,
}).then((SQL) => {
    const output = document.getElementById("output");

    fetch("symbols.db")
        .then((response) => {
            if (!response.ok) {
                throw new Error("Failed to load database file");
            }
            return response.arrayBuffer();
        })
        .then((arrayBuffer) => {
            const uInt8Array = new Uint8Array(arrayBuffer);
            db = new SQL.Database(uInt8Array);
            console.log("got database");
        })
        .catch((error) => {
            output.textContent = `Error: ${error.message}`;
        });
});

var searchbox = document.getElementById("searchbox");
var resultsArea = document.getElementById("results");

function performSearch() {
    const searchterm = searchbox.value.trim();
    if (!db) {
        resultsArea.textContent = "database not loaded yet";
        return;
    }

    resultsArea.innerHTML = "";

    if (searchterm === "") {
        return;
    }
    try {
        const query = `
            SELECT * 
            FROM symbols
            WHERE label LIKE '%${searchterm}%';
        `;
        const result = db.exec(query);

        // Display the results
        if (result.length > 0) {
            // resultsArea.textContent = JSON.stringify(result, null, 2);
            const symbols = result[0]["values"];
            symbols.forEach((symbol) => {
                figure = document.createElement("figure");
                image = document.createElement("img");
                caption = document.createElement("figcaption");
                label = document.createElement("span");
                credit = document.createElement("span");

                image.src = "/assets/symbols/" + symbol[0].split("/").slice(-1);
                image.alt = symbol[3];
                label.textContent = symbol[2];

                artist_list = eval(symbol[4]);
                console.log(artist_list);
                console.log(artist_list.length);
                if (symbol[5] == "edit") {
                    credit.textContent = ` by ${artist_list[0]}, edited by ${artist_list[1]}`;
                } else if (artist_list.length == 3) {
                    credit.textContent = ` by ${artist_list[0]}, ${artist_list[1]}, and ${artist_list[2]}`;
                } else if (artist_list.length == 2) {
                    credit.textContent = ` by ${artist_list[0]} and ${artist_list[1]}`;
                } else {
                    credit.textContent = ` by ${artist_list[0]}`;
                }

                caption.appendChild(label);
                caption.appendChild(credit);
                figure.append(image);
                figure.append(caption);
                resultsArea.append(figure);
            });
        } else {
            resultsArea.textContent = "No results found.";
        }
    } catch (error) {
        resultsArea.textContent = `error: ${error.message}`;
    }
}
