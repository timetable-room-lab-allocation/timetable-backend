const pool = require("../../config/db");
const bcrypt = require("bcryptjs");

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: "Email and password are required"
            });
        }

        // Find user by email
        const [users] = await pool.query(
            `
            SELECT
                id,
                name,
                email,
                password_hash,
                role,
                student_group_id
            FROM users
            WHERE email = ?
            `,
            [email]
        );

        // User not found
        if (users.length === 0) {
            console.log("LOGIN DEBUG: User not found:", email);

            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const user = users[0];

        // Debug information
        console.log("LOGIN DEBUG:", {
            email: user.email,
            role: user.role,
            password_hash_exists: !!user.password_hash,
            password_hash_length: user.password_hash?.length
        });

        // Compare password with hashed password
        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        console.log("PASSWORD MATCH:", passwordMatch);

        // Wrong password
        if (!passwordMatch) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        // Login successful
        return res.status(200).json({
            success: true,
            message: "Login successful",
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                student_group_id: user.student_group_id
            }
        });

    } catch (error) {
        console.error("Login error:", error);

        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

module.exports = {
    login
};
