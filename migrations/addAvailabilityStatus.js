const pool = require("../config/db");

async function migrate() {
    try {
        await pool.query(`
            ALTER TABLE lecturer_availability
            ADD COLUMN status
            ENUM('allowed', 'preferred', 'blocked')
            NOT NULL DEFAULT 'allowed'
            AFTER timeslot_id
        `);

        console.log("status column added successfully");

    } catch (error) {
        console.error("Migration failed:", error);
    } finally {
        await pool.end();
    }
}

migrate();