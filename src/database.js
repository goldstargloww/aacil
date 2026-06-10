export async function make_databases(load_csv) {
    let test_data = await load_csv('/AAC/aac.csv');
    console.log(test_data);
}
