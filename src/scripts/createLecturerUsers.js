const pool = require("../../config/db");
const bcrypt = require("bcryptjs");

const lecturers = [
    {
        lecturerId: 2,
        name: "Dr. Mohammed",
        email: "mohammed@smart.edu",
        password: "mohammed123",
    },
    {
        lecturerId: 3,
        name: "Dr. Mahmoud",
        email: "mahmoud@smart.edu",
        password: "mahmoud123",
    },
    {
        lecturerId: 4,
        name: "Dr. Abdelrahman",
        email: "abdelrahman@smart.edu",
        password: "abdel123",
    },
    {
        lecturerId: 6,
        name: "Dr. Hassan",
        email: "hassan@smart.edu",
        password: "hassan123",
    },
];

async function createLecturerUsers() {
    try {
        console.log("Creating lecturer users...");

        for (const lecturer of lecturers) {
            const passwordHash = await bcrypt.hash(
                lecturer.password,
                10
            );

            // Create or update user
            await pool.query(
                `
                INSERT INTO users
                    (name, email, password_hash, role)
                VALUES
                    (?, ?, ?, 'Lecturer')
                ON DUPLICATE KEY UPDATE
                    name = VALUES(name),
                    password_hash = VALUES(password_hash),
                    role = 'Lecturer'
                `,
                [
                    lecturer.name,
                    lecturer.email,
                    passwordHash,
                ]
            );

            // Get the real user ID
            const [users] = await pool.query(
                `
                SELECT id
                FROM users
                WHERE email = ?
                `,
                [lecturer.email]
            );

            if (users.length === 0) {
                throw new Error(
                    `User was not found after creation: ${lecturer.email}`
                );
            }

            const userId = users[0].id;

            // Link lecturer to user
            await pool.query(
                `
                UPDATE lecturers
                SET user_id = ?
                WHERE id = ?
                `,
                [
                    userId,
                    lecturer.lecturerId,
                ]
            );

            console.log(
                `✓ ${lecturer.name} -> user_id ${userId}`
            );
        }

        console.log("\nAll lecturer users created and linked successfully!");

        // Show final result
        const [rows] = await pool.query(
            `
            SELECT
                l.id AS lecturer_id,
                l.name AS lecturer_name,
                l.user_id,
                u.email,
                u.role
            FROM lecturers l
            LEFT JOIN users u
                ON u.id = l.user_id
            ORDER BY l.id
            `
        );

        console.table(rows);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await pool.end();
    }
}

createLecturerUsers();