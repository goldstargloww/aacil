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
    db.exec(`create table sym_artists(
            img_id integer,
            artist_id integer,
            primary key(img_id, artist_id),
            foreign key(img_id) references images(id),
            foreign key(artist_id) references artists(id)
        );`)
    db.exec(`create table sym_derived_from(
            img_id integer,
            artist_id integer,
            primary key(img_id, artist_id),
            foreign key(img_id) references images(id),
            foreign key(artist_id) references artists(id)
        );`)
    db.exec(`create table categories(
            id integer primary_key,
            desc string not null,
            icon_id integer,
            cw string,
            foreign key(icon_id) references images(id)
        );`);
    db.exec(`create table subcategories(
            parent_id integer,
            child_id integer,
            primary key(parent_id, child_id),
            foreign key(parent_id) references categories(id),
            foreign key(child_id) references categories(id)
        );`)
    db.exec(`create table cat_syms(
            cat_id integer,
            img_id integer,
            override_caption string,
            primary key(cat_id, img_id),
            foreign key(cat_id) references categories(id),
            foreign key(img_id) references images(id)
        );`);
    db.exec(`create table cw_suppressions(
            cat_id integer,
            cw_id integer,
            override_caption string,
            primary key(cat_id, cw_id),
            foreign key(cat_id) references categories(id),
            foreign key(cw_id) references page_cw(id)
        );`);

    // Import CSVs into database
    async function import_one_csv(name) {
        let data = await load_csv(`/database/${name}.csv`);
        for (let row of data) {
            let cols_template = "";
            let q_template = "";
            let values = [];
            for (let [col_name, col_value] of Object.entries(row)) {
                if (col_value.length == 0)
                    continue;
                cols_template += `${col_name},`;
                q_template += '?,';
                values.push(col_value);
            }

            // strip training comma
            cols_template = cols_template.slice(0, -1);
            q_template = q_template.slice(0, -1);

            try {
                db.exec(`insert into ${name}(${cols_template}) values (${q_template})`, {
                    bind: values,
                })
            } catch (e) {
                console.log("Failed to insert!", row, e);
                throw e;
            }
        }
    }
    await import_one_csv('page_cw');
    await import_one_csv('images');
    await import_one_csv('artists');
    await import_one_csv('sym_artists');
    await import_one_csv('sym_derived_from');
    await import_one_csv('categories');
    await import_one_csv('subcategories');
    await import_one_csv('cat_syms');
    await import_one_csv('cw_suppressions');

    // db.exec("insert into page_cw(id, text) values(?, 'hewwo testing');", Snowflake.generate());
    let result = [];
    db.exec("select images.filename, categories.desc from cat_syms JOIN images ON cat_syms.img_id = images.id JOIN categories ON cat_syms.cat_id = categories.id;", {
        rowMode: 'object',
        resultRows: result,
    });
    console.log(result);
}
