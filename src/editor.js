import { parse as csv_parse, Buffer } from 'csv-parse/browser/esm'

console.log("This is the editor WIP!", csv_parse);

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
