const pool = require("../config/db");

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
                t.end_time
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
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch lecturer availability"
        });
    }
};


// Set lecturer availability
const setLecturerAvailability = async (req, res) => {
    const connection = await pool.getConnection();

    try {
        const { lecturerId } = req.params;
        const { timeslot_ids } = req.body;

        if (!Array.isArray(timeslot_ids)) {
            return res.status(400).json({
                success: false,
                message: "timeslot_ids must be an array"
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

        // Add new availability
        for (const timeslotId of timeslot_ids) {
            await connection.query(
                `
                INSERT INTO lecturer_availability
                (
                    lecturer_id,
                    timeslot_id
                )
                VALUES (?, ?)
                `,
                [lecturerId, timeslotId]
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