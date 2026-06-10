import { Snowflake } from "@theinternetfolks/snowflake";

export async function make_databases(sqlite3, load_csv) {
    const db = new sqlite3.oo1.DB();

    // Create all tables
    db.exec("create table page_cw(id integer primary key, text string not null);")
    db.exec(`create table images (
            id integer primary key,
            filename string not null unique,
            caption string not null,
            alt_text string not null,
            cw_id integer,
            foreign key(cw_id) references page_cw(id)
        );`);
    db.exec(`create table artists (
            id integer primary key,
            display string not null,
            front_page_footnote string,
            front_page_parens string
        );`)

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
    await import_one_csv('images');
    await import_one_csv('artists');

    // db.exec("insert into page_cw(id, text) values(?, 'hewwo testing');", Snowflake.generate());
    let result = [];
    db.exec("select * from artists;", {
        rowMode: 'object',
        resultRows: result,
    });
    console.log(result);
}
