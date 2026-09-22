require("dotenv").config();

const readline = require("readline");
const bcrypt = require("bcryptjs");
const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question("Enter new password: ", async (password) => {
    if (!password || password.length < 8) {
        console.log("Password must be at least 8 characters.");
        rl.close();
        return;
    }

    let connection;

    try {
        const hash = await bcrypt.hash(password, 10);

        const sslCaPath = path.join(__dirname, "aiven-ca.pem");

        connection = await mysql.createConnection({
            host: process.env.DB_HOST,
            port: Number(process.env.DB_PORT),
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            database: process.env.DB_NAME,
            ssl: {
                ca: fs.readFileSync(sslCaPath, "utf8"),
                rejectUnauthorized: true
            }
        });

        const [result] = await connection.execute(
            "UPDATE users SET password_hash = ? WHERE email = ?",
            [hash, "admin2@smart.edu"]
        );

        if (result.affectedRows === 1) {
            console.log("Password reset successfully.");
        } else {
            console.log("User not found.");
        }

    } catch (error) {
        console.error("Reset failed:", error.message);
    } finally {
        if (connection) {
            await connection.end();
        }

        rl.close();
    }
});