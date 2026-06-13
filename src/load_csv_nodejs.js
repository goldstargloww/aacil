import fs from "node:fs";
import { parse as csv_parse } from 'csv-parse';

import Os from 'os'
let __site = new URL("../site", import.meta.url).pathname;
if (Os.platform() === 'win32' && __site.startsWith('/')) {
    __site = __site.slice(1);
}

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
