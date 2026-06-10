import { parse as csv_parse, Buffer } from 'csv-parse/browser/esm'

window.onload = async () => {
    const sqlite3 = await window.sqlite3InitModule();

    console.log("This is the editor WIP!", csv_parse, sqlite3, sqlite3.version.libVersion);

    let test_csv = await fetch('/AAC/aac.csv');
    if (!test_csv.ok) {
        throw new Error(`Response status: ${test_csv.status}`);
    }
    test_csv = await test_csv.text();
    console.log(test_csv);

    const parser = csv_parse(
        test_csv,
        {
            columns: true,
        },
        (err, data) => {
            console.log(err, data);
        }
    );
};
