import { Snowflake } from "@theinternetfolks/snowflake";

export async function make_databases(sqlite3, load_csv) {
    const db = new sqlite3.oo1.DB();

    // Create all tables
    db.exec("create table page_cw(id integer primary key, text string not null);")

    // Import CSVs into database
    async function import_one_csv(name) {
        let data = await load_csv(`/database/${name}.csv`);
        for (let row of data) {
            let cols_template = "";
            let q_template = "";
            let values = [];
            for (let [col_name, col_value] of Object.entries(row)) {
                cols_template += `${col_name},`;
                q_template += '?,';
                values.push(col_value);
            }

            // strip training comma
            cols_template = cols_template.slice(0, -1);
            q_template = q_template.slice(0, -1);

            db.exec(`insert into ${name}(${cols_template}) values (${q_template})`, {
                bind: values,
            })
        }
    }
    await import_one_csv('page_cw');

    db.exec("insert into page_cw(id, text) values(?, 'hewwo testing');", Snowflake.generate());
    let result = [];
    db.exec("select * from page_cw;", {
        rowMode: 'object',
        resultRows: result,
    });
    console.log(result);
}
