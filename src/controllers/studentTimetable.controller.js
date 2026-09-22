const pool = require("../config/db");

const getStudentTimetable = async (req, res) => {
    try {
        const { studentGroupId } = req.params;

        if (!studentGroupId) {
            return res.status(400).json({
                success: false,
                message: "studentGroupId is required"
            });
        }

        const [rows] = await pool.query(
            `
            SELECT
                a.id AS allocation_id,

                s.id AS section_id,
                s.name AS section_name,

                c.id AS course_id,
                c.code AS course_code,
                c.name AS course_name,

                l.id AS lecturer_id,
                l.name AS lecturer_name,

                r.id AS room_id,
                r.name AS room_name,

                t.id AS timeslot_id,
                t.day,
                t.start_time,
                t.end_time

            FROM allocations a

            INNER JOIN sections s
                ON a.section_id = s.id

            INNER JOIN courses c
                ON s.course_id = c.id

            LEFT JOIN lecturers l
                ON a.lecturer_id = l.id

            INNER JOIN rooms r
                ON a.room_id = r.id

            INNER JOIN timeslots t
                ON a.timeslot_id = t.id

            WHERE s.student_group_id = ?
              AND a.status = 'Approved'

            ORDER BY
                FIELD(
                    t.day,
                    'Saturday',
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday'
                ),
                t.start_time
            `,
            [studentGroupId]
        );

        return res.json({
            success: true,
            message: "Student timetable fetched successfully",
            data: rows
        });

    } catch (error) {
        console.error(
            "Student timetable error:",
            error
        );

        return res.status(500).json({
            success: false,
            message: "Failed to fetch student timetable"
        });
    }
};

module.exports = {
    getStudentTimetable
};