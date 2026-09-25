const mysql = require("mysql2/promise");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

const localCaPath = path.join(__dirname, "../aiven-ca.pem");

let ssl;

if (process.env.DB_SSL === "true") {
    const ca = process.env.DB_SSL_CA
        ? process.env.DB_SSL_CA.replace(/\\n/g, "\n")
        : fs.readFileSync(localCaPath, "utf8");

    ssl = {
        ca,
        rejectUnauthorized: true
    };
}

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool;