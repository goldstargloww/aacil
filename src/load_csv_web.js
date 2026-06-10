import { parse as csv_parse } from 'csv-parse/browser/esm/sync';

async function load_csv(path) {
    const resp = await fetch(path);
    if (!resp.ok) {
        throw new Error(`Fetch failed, status: ${resp.status}`);
    }
    const csv_data = await resp.text();
    return csv_parse(csv_data, {
        columns: true,
    });
};
export default load_csv;
