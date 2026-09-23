const pool = require("./src/config/db");

async function checkRoles() {
  try {
    const [rows] = await pool.query(`
      SELECT id, name, email, role, student_group_id
      FROM users
      WHERE role IN ('Coordinator', 'Facilities', 'Lecturer')
      ORDER BY id
    `);

    console.table(rows);
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

checkRoles();