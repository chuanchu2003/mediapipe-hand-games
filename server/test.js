require("dotenv").config();

const db = require("./database");

async function test() {

    const result = await db.execute(
        "SELECT 1 as ok"
    );

    console.log(result.rows);

}

test();