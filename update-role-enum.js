const pool = require("./src/config/db");

async function updateRoleEnum() {
  try {
    await pool.query(`
      ALTER TABLE users
      MODIFY COLUMN role
      ENUM(
        'Admin',
        'Student',
        'Lecturer',
        'Coordinator',
        'Facilities'
      )
      NOT NULL
    `);

    console.log("Role enum updated successfully.");
  } catch (error) {
    console.error("Error updating role enum:", error);
  } finally {
    await pool.end();
  }
}

updateRoleEnum();