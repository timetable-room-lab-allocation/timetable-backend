const pool = require("../config/db");

async function fixAllocationsSchema() {
    try {
        console.log("Checking allocations schema...");

        const [before] = await pool.query(`
            DESCRIBE allocations
        `);

        console.log("Before:");
        console.table(
            before.filter(
                (column) =>
                    column.Field === "room_id" ||
                    column.Field === "timeslot_id"
            )
        );

        console.log("Altering allocations table...");

        await pool.query(`
            ALTER TABLE allocations
            MODIFY COLUMN room_id INT NULL,
            MODIFY COLUMN timeslot_id INT NULL
        `);

        const [after] = await pool.query(`
            DESCRIBE allocations
        `);

        console.log("After:");
        console.table(
            after.filter(
                (column) =>
                    column.Field === "room_id" ||
                    column.Field === "timeslot_id"
            )
        );

        console.log("Schema updated successfully.");
    } catch (error) {
        console.error("Failed to update schema:");
        console.error(error);
    } finally {
        await pool.end();
    }
}

fixAllocationsSchema();