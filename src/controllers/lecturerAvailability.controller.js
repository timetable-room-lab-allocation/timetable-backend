const pool = require("../../config/db");

// Get lecturer availability
const getLecturerAvailability = async (req, res) => {
    try {
        const { lecturerId } = req.params;

        const [rows] = await pool.query(
            `
            SELECT
                la.lecturer_id,
                t.id AS timeslot_id,
                t.day,
                t.start_time,
                t.end_time,
                la.status
            FROM lecturer_availability la
            JOIN timeslots t
                ON la.timeslot_id = t.id
            WHERE la.lecturer_id = ?
            ORDER BY t.id
            `,
            [lecturerId]
        );

        return res.json({
            success: true,
            availability: rows
        });

    } catch (error) {
        console.error("GET lecturer availability error:", error);

        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Set lecturer availability
const setLecturerAvailability = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { lecturerId } = req.params;
        const { availability } = req.body;

if (!Array.isArray(availability)) {
    return res.status(400).json({
        success: false,
        message: "availability must be an array"
    });
}

        await connection.beginTransaction();

        // Remove old availability
        await connection.query(
            `
            DELETE FROM lecturer_availability
            WHERE lecturer_id = ?
            `,
            [lecturerId]
        );

        // Add allowed / preferred slots
        for (const item of availability) {

            if (!item.timeslot_id) {
                continue;
            }

            if (
                item.status !== "allowed" &&
                item.status !== "preferred"
            ) {
                continue;
            }

            await connection.query(
                `
                INSERT INTO lecturer_availability
                (
                    lecturer_id,
                    timeslot_id,
                    status
                )
                VALUES (?, ?, ?)
                `,
                [
                    lecturerId,
                    item.timeslot_id,
                    item.status
                ]
            );
        }

        await connection.commit();

        return res.json({
            success: true,
            message: "Lecturer availability updated successfully"
        });

    } catch (error) {
        await connection.rollback();

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to update lecturer availability"
        });

    } finally {
        connection.release();
    }
};


module.exports = {
    getLecturerAvailability,
    setLecturerAvailability
};