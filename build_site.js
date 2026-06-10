import fs from "node:fs";
import sqlite from 'node:sqlite';
import { parse as csv_parse } from 'csv-parse';

const __dirname = new URL(".", import.meta.url).pathname;

console.log("Hello world!", sqlite);

const processFile = async () => {
    const parser = fs.createReadStream(`${__dirname}/site/AAC/aac.csv`).pipe(
        csv_parse({
            columns: true,
        }),
    );
    for await (const record of parser) {
        console.log(record);
    }
};

(async () => {
    await processFile();
})();
