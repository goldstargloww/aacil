import fs from "node:fs";
import { parse as csv_parse } from 'csv-parse';

const __site = new URL("../site", import.meta.url).pathname;

async function load_csv(path) {
    const parser = fs.createReadStream(`${__site}${path}`).pipe(
        csv_parse({
            columns: true,
        }),
    );
    let data = [];
    for await (const record of parser) {
        data.push(record);
    }
    return data;
}
export default load_csv;
