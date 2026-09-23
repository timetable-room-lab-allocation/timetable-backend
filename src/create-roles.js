const bcrypt = require("bcrypt");
const pool = require("./src/config/db");

const users = [
  {
    name: "Ahmed Coordinator",
    email: "coordinator@smart.edu",
    password: "Coordinator@123",
    role: "Coordinator",
  },
  {
    name: "Ahmed Facilities",
    email: "facilities@smart.edu",
    password: "Facilities@123",
    role: "Facilities",
  },
  {
    name: "Ahmed Lecturer",
    email: "lecturer@smart.edu",
    password: "Lecturer@123",
    role: "Lecturer",
  },
];

async function createUsers() {
  try {
    for (const user of users) {
      const passwordHash = await bcrypt.hash(user.password, 10);

      await pool.query(
        `
        INSERT INTO users
          (name, email, password_hash, role, student_group_id)
        VALUES
          (?, ?, ?, ?, NULL)
        `,
        [
          user.name,
          user.email,
          passwordHash,
          user.role,
        ]
      );

      console.log(`Created: ${user.email}`);
    }

    console.log("All accounts created successfully.");
  } catch (error) {
    console.error("Error creating accounts:", error);
  } finally {
    await pool.end();
  }
}

createUsers();