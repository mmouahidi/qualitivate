var k = require("knex");
var c = require("./src/config/knexfile").default;
var d = k(c.production);
d.migrate.latest().then(function (r) {
    console.log("Migration complete:", JSON.stringify(r));
    process.exit(0);
}).catch(function (e) {
    console.error("Migration error:", e.message);
    process.exit(1);
});
