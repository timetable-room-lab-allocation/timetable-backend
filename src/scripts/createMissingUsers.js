const pool = require("../../config/db");
const bcrypt = require("bcryptjs");

async function createMissingUsers() {
  try {
    const [info] = await pool.query(`
  SELECT
    DATABASE() AS db_name,
    @@hostname AS server_host,
    @@port AS server_port,
    CURRENT_USER() AS db_account
`);

console.table(info);
    console.log("Creating missing users...");

    const lecturerPassword = await bcrypt.hash("lecturer123", 10);
    const coordinatorPassword = await bcrypt.hash("coordinator123", 10);

    // Create Lecturer
    await pool.query(
      `
      INSERT INTO users
        (name, email, password_hash, role, student_group_id)
      VALUES
        (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        role = VALUES(role)
      `,
      [
        "Ahmed Lecturer",
        "lecturer@smart.edu",
        lecturerPassword,
        "Lecturer",
        null,
      ]
    );

    // Create Coordinator
    await pool.query(
      `
      INSERT INTO users
        (name, email, password_hash, role, student_group_id)
      VALUES
        (?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        password_hash = VALUES(password_hash),
        role = VALUES(role)
      `,
      [
        "Ahmed Coordinator",
        "coordinator@smart.edu",
        coordinatorPassword,
        "Coordinator",
        null,
      ]
    );
    await pool.query(
  `
  UPDATE lecturers
  SET user_id = ?
  WHERE id = ?
  `,
  [5, 1]
);

console.log("Lecturer linked successfully!");

    console.log("");
    console.log("=================================");
    console.log("Users created successfully!");
    const [users] = await pool.query(
  "SELECT id, name, email, role FROM users ORDER BY id"
);

console.table(users);
    console.log("=================================");
    console.log("");

    console.log("Lecturer:");
    console.log("Email: lecturer@smart.edu");
    console.log("Password: lecturer123");

    console.log("");

    console.log("Coordinator:");
    console.log("Email: coordinator@smart.edu");
    console.log("Password: coordinator123");

    console.log("");
  } catch (error) {
    console.error("Error creating users:", error);
  } finally {
    await pool.end();
  }
}

createMissingUsers();