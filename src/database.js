import { Snowflake } from "@theinternetfolks/snowflake";
import { stringify as csv_stringify } from 'csv-stringify/browser/esm';
import JSZip from "jszip";

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
                console.error("Failed to insert!", row, e);
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

    return db;
}

function export_one_db(db, query) {
    return new Promise((resolve, reject) => {
        let wrote_header = false;
        let byte_frags = [];
        const stringifier = csv_stringify({
            record_delimiter: "\r\n",
        });
        stringifier.on('readable', () => {
            let row;
            while ((row = stringifier.read()) !== null) {
                byte_frags.push(row);
            }
        });
        stringifier.on('error', function (err) {
            reject(err);
        });
        stringifier.on("finish", () => {
            resolve(new Blob(byte_frags, {
                type: 'text/csv',
            }));
        });
        db.exec(query, {
            callback: (row, stmt) => {
                if (!wrote_header) {
                    stringifier.write(stmt.getColumnNames());
                    wrote_header = true;
                }
                stringifier.write(row);
            },
        });
        stringifier.end();
    });
}

export async function export_databases(db) {
    let zip = new JSZip();
    zip.file("page_cw.csv", export_one_db(db, "select * from page_cw order by id"));
    zip.file("images.csv", export_one_db(db, "select * from images order by id"));
    zip.file("artists.csv", export_one_db(db, "select * from artists order by id"));
    zip.file("sym_artists.csv", export_one_db(db, "select * from sym_artists order by img_id, artist_id"));
    zip.file("sym_derived_from.csv", export_one_db(db, "select * from sym_derived_from order by img_id, artist_id"));
    zip.file("categories.csv", export_one_db(db, "select * from categories order by id"));
    zip.file("subcategories.csv", export_one_db(db, "select * from subcategories order by parent_id, child_id"));
    zip.file("cat_syms.csv", export_one_db(db, "select * from cat_syms order by cat_id, img_id"));
    zip.file("cw_suppressions.csv", export_one_db(db, "select * from cw_suppressions order by cat_id, cw_id"));

    return await zip.generateAsync({ type: 'blob' });
}
