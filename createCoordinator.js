const bcrypt = require("bcrypt");
const pool = require("./src/config/db");

async function createCoordinator() {
  try {
    const passwordHash = await bcrypt.hash("Coordinator@123", 10);

    await pool.query(
      `
      INSERT INTO users
        (name, email, password_hash, role, student_group_id)
      VALUES
        (?, ?, ?, ?, NULL)
      `,
      [
        "Ahmed Coordinator",
        "coordinator@smart.edu",
        passwordHash,
        "Coordinator",
      ]
    );

    console.log("Coordinator created successfully.");
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await pool.end();
  }
}

createCoordinator();