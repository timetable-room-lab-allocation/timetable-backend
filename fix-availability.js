const pool = require("./src/config/db");

async function fixAvailability() {
    try {
        console.log("Connecting to Aiven database...");

        const [before] = await pool.query(`
            SELECT
                la.lecturer_id,
                la.timeslot_id,
                t.day,
                t.start_time,
                t.end_time
            FROM lecturer_availability la
            JOIN timeslots t
                ON la.timeslot_id = t.id
            WHERE la.lecturer_id = 1
            ORDER BY la.timeslot_id
        `);

        console.log("\nBEFORE:");
        console.table(before);

        await pool.query(`
            INSERT INTO lecturer_availability
                (lecturer_id, timeslot_id)
            VALUES
                (1, 2)
        `);

        const [after] = await pool.query(`
            SELECT
                la.lecturer_id,
                la.timeslot_id,
                t.day,
                t.start_time,
                t.end_time
            FROM lecturer_availability la
            JOIN timeslots t
                ON la.timeslot_id = t.id
            WHERE la.lecturer_id = 1
            ORDER BY la.timeslot_id
        `);

        console.log("\nAFTER:");
        console.table(after);

        await pool.end();

    } catch (error) {
        console.error("\nERROR:");
        console.error(error.message);

        await pool.end();
        process.exit(1);
    }
}

fixAvailability();