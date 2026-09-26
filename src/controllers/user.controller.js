const pool = require("../../config/db");

const getUsers = async (req, res) => {
    try {
        const [users] = await pool.query(`
            SELECT
                id,
                name,
                email,
                role,
                student_group_id,
                created_at
            FROM users
            ORDER BY id DESC
        `);

        return res.status(200).json({
            success: true,
            users
        });

    } catch (error) {
        console.error("Get users error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch users"
        });
    }
};

module.exports = {
    getUsers
};
