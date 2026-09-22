const pool = require("../config/db");
const { getRecommendations } = require("../services/fastapi.service");

const generateRecommendations = async (req, res) => {
    console.log("🔥 AI CONTROLLER CALLED");

    try {
        // =========================================================
        // REQUEST
        // =========================================================

        console.log("📦 BODY:", req.body);

        const { section_id } = req.body;

        console.log("🆔 SECTION ID:", section_id);

        if (!section_id) {
            return res.status(400).json({
                success: false,
                message: "section_id is required",
                error_code: "INVALID_REQUEST",
            });
        }

        // =========================================================
        // STEP 1 - Get Section
        // =========================================================

        console.log("🔎 About to query section...");

        const [rows] = await pool.query(
            `
            SELECT
                s.id,
                s.name,
                s.students,
                s.duration,
                s.room_type_required,
                s.lecturer_id,
                s.student_group_id
            FROM sections s
            WHERE s.id = ?
            `,
            [section_id]
        );

        console.log("✅ SECTION QUERY RESULT:", rows);

        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Section not found",
                error_code: "SECTION_NOT_FOUND",
            });
        }

        const section = rows[0];

        console.log("✅ SECTION FOUND:", section);

        // =========================================================
        // STEP 1.5 - Get Student Group
        // =========================================================

        const [groupRows] = await pool.query(
            `
            SELECT
                id,
                name
            FROM student_groups
            WHERE id = ?
            `,
            [section.student_group_id]
        );

        console.log("👥 STUDENT GROUP RESULT:", groupRows);

        if (groupRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Student group not found",
                error_code: "STUDENT_GROUP_NOT_FOUND",
            });
        }

        section.student_group = groupRows[0].name;

        console.log(
            "✅ STUDENT GROUP:",
            section.student_group
        );

        // =========================================================
        // STEP 2 - Check Approved Allocation
        // =========================================================

        const [approvedSectionAllocations] = await pool.query(
            `
            SELECT
                a.id,
                a.room_id,
                a.timeslot_id,
                r.name AS room_name,
                t.day,
                t.start_time,
                t.end_time
            FROM allocations a
            JOIN rooms r
                ON a.room_id = r.id
            JOIN timeslots t
                ON a.timeslot_id = t.id
            WHERE a.section_id = ?
              AND a.status = 'Approved'
            ORDER BY a.id DESC
            `,
            [section.id]
        );

        console.log(
            "STEP 2 - Approved allocations:",
            approvedSectionAllocations
        );

        if (approvedSectionAllocations.length > 0) {
            return res.json({
                success: true,
                section_id: section.id,
                recommendations: [],
                message:
                    "This section already has an approved allocation.",
            });
        }

        // =========================================================
        // STEP 3 - Get Lecturer
        // =========================================================

        console.log(
            "👨‍🏫 About to query lecturer:",
            section.lecturer_id
        );

        const [lecturerRows] = await pool.query(
            `
            SELECT
                l.id,
                l.name
            FROM lecturers l
            WHERE l.id = ?
            `,
            [section.lecturer_id]
        );

        console.log(
            "👨‍🏫 LECTURER RESULT:",
            lecturerRows
        );

        if (lecturerRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Lecturer not found",
                error_code: "LECTURER_NOT_FOUND",
            });
        }

        const lecturer = lecturerRows[0];

        console.log(
            "✅ LECTURER FOUND:",
            lecturer
        );

        // =========================================================
        // STEP 4 - Lecturer Availability
        // =========================================================

        const [availabilityRows] = await pool.query(
            `
            SELECT
                t.id,
                t.day,
                t.start_time,
                t.end_time
            FROM lecturer_availability la
            JOIN timeslots t
                ON la.timeslot_id = t.id
            WHERE la.lecturer_id = ?
            ORDER BY t.id
            `,
            [lecturer.id]
        );

        const available_slots = availabilityRows.map(
            (slot) =>
                `${slot.day}_${slot.start_time.slice(
                    0,
                    2
                )}_${slot.end_time.slice(0, 2)}`
        );

        console.log(
            "STEP 4 - Availability:",
            available_slots
        );

        // =========================================================
        // STEP 5 - Lecturer Preferences
        // =========================================================

        const [preferenceRows] = await pool.query(
            `
            SELECT
                t.id,
                t.day,
                t.start_time,
                t.end_time
            FROM lecturer_preferences lp
            JOIN timeslots t
                ON lp.timeslot_id = t.id
            WHERE lp.lecturer_id = ?
            ORDER BY t.id
            `,
            [lecturer.id]
        );

        const preferred_slots = preferenceRows.map(
            (slot) =>
                `${slot.day}_${slot.start_time.slice(
                    0,
                    2
                )}_${slot.end_time.slice(0, 2)}`
        );

        console.log(
            "STEP 5 - Preferences:",
            preferred_slots
        );

        // =========================================================
        // STEP 6 - Get Available Rooms + Equipment
        // =========================================================

        const [roomRows] = await pool.query(
            `
            SELECT
                r.id,
                r.name,
                r.room_type,
                r.capacity,
                r.is_available
            FROM rooms r
            WHERE r.is_available = TRUE
            ORDER BY r.id
            `
        );

        console.log(
            "STEP 6 - Available rooms:",
            roomRows
        );

        const rooms = [];

        for (const room of roomRows) {
            const [equipmentRows] = await pool.query(
                `
                SELECT
                    e.name
                FROM room_equipment re
                JOIN equipment e
                    ON re.equipment_id = e.id
                WHERE re.room_id = ?
                ORDER BY e.id
                `,
                [room.id]
            );

            const roomData = {
                id: room.id,
                name: room.name,
                room_type: room.room_type,
                capacity: room.capacity,
                equipment: equipmentRows.map(
                    (equipment) => equipment.name
                ),
                available: Boolean(room.is_available),
            };

            rooms.push(roomData);

            console.log(
                `🏫 ROOM ${room.id} EQUIPMENT:`,
                roomData.equipment
            );
        }

        console.log(
            "✅ ROOMS SENT TO AI:",
            rooms
        );

        // =========================================================
        // STEP 7 - Get Timeslots
        // =========================================================

        const [timeslotRows] = await pool.query(
            `
            SELECT
                id,
                day,
                start_time,
                end_time
            FROM timeslots
            ORDER BY id
            `
        );

        const timeslots = timeslotRows.map(
            (slot) => ({
                id: slot.id,
                day: slot.day,
                start: slot.start_time,
                end: slot.end_time,
            })
        );

        console.log(
            "STEP 7 - Timeslots:",
            timeslots
        );

        // =========================================================
        // STEP 8 - Section Required Equipment
        // =========================================================

        const [sectionEquipmentRows] = await pool.query(
            `
            SELECT
                e.name
            FROM section_equipment se
            JOIN equipment e
                ON se.equipment_id = e.id
            WHERE se.section_id = ?
            ORDER BY e.id
            `,
            [section.id]
        );

        const equipment_required =
            sectionEquipmentRows.map(
                (equipment) => equipment.name
            );

        console.log(
            "STEP 8 - Section required equipment:",
            equipment_required
        );

        // =========================================================
        // STEP 9 - Get Approved Allocations
        // =========================================================

        const [allocationRows] = await pool.query(
            `
            SELECT
                a.id AS allocation_id,

                s.id AS section_id,
                s.name AS section_name,
                s.students AS section_students,
                s.duration AS section_duration,
                s.room_type_required,
                sg.name AS student_group,

                l.id AS lecturer_id,
                l.name AS lecturer_name,

                r.id AS room_id,
                r.name AS room_name,
                r.room_type,
                r.capacity,
                r.is_available,

                t.id AS timeslot_id,
                t.day,
                t.start_time,
                t.end_time

            FROM allocations a

            JOIN sections s
                ON a.section_id = s.id

            JOIN student_groups sg
                ON s.student_group_id = sg.id

            JOIN lecturers l
                ON a.lecturer_id = l.id

            JOIN rooms r
                ON a.room_id = r.id

            JOIN timeslots t
                ON a.timeslot_id = t.id

            WHERE a.status = 'Approved'

            ORDER BY a.id
            `
        );

        console.log(
            "STEP 9 - Approved allocation rows:",
            allocationRows
        );

        // =========================================================
        // STEP 10 - Build AI Request
        // =========================================================

        const requestData = {
            section: {
                id: section.id,
                name: section.name,
                students: section.students,
                student_group: section.student_group,
                duration: section.duration,
                room_type_required:
                    section.room_type_required,
                equipment_required:
                    equipment_required,
                lecturer_id:
                    section.lecturer_id,
            },

            lecturer: {
                id: lecturer.id,
                name: lecturer.name,
                available_slots:
                    available_slots,
                preferred_slots:
                    preferred_slots,
            },

            rooms: rooms,

            timeslots: timeslots,

            existing_allocations:
                allocationRows.map((row) => ({
                    section: {
                        id: row.section_id,
                        name: row.section_name,
                        students:
                            row.section_students,
                        student_group:
                            row.student_group,
                        duration:
                            row.section_duration,
                        room_type_required:
                            row.room_type_required,
                        equipment_required: [],
                        lecturer_id:
                            row.lecturer_id,
                    },

                    lecturer: {
                        id: row.lecturer_id,
                        name: row.lecturer_name,
                        available_slots: [],
                        preferred_slots: [],
                    },

                    room: {
                        id: row.room_id,
                        name: row.room_name,
                        room_type:
                            row.room_type,
                        capacity:
                            row.capacity,
                        equipment: [],
                        available:
                            Boolean(
                                row.is_available
                            ),
                    },

                    timeslot: {
                        id: row.timeslot_id,
                        day: row.day,
                        start:
                            row.start_time,
                        end:
                            row.end_time,
                    },
                })),
        };

        // =========================================================
        // DEBUG - Final AI Request
        // =========================================================

        console.log(
            "========== AI REQUEST =========="
        );

        console.log(
            JSON.stringify(
                requestData,
                null,
                2
            )
        );

        console.log(
            "================================"
        );

        // =========================================================
        // STEP 11 - Call FastAPI
        // =========================================================

        console.log(
            "🚀 Sending request to FastAPI..."
        );

        const recommendations =
            await getRecommendations(
                requestData
            );

        console.log(
            "🤖 FASTAPI RESPONSE:",
            recommendations
        );

        // =========================================================
        // STEP 12 - Return Recommendations
        // =========================================================

        return res.json({
            success: true,
            section_id: section.id,
            recommendations:
                recommendations.recommendations,
        });

    } catch (error) {
        console.error(
            "❌ AI controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                error.message ||
                "Internal server error",
            error_code:
                "AI_RECOMMENDATION_ERROR",
        });
    }
};

module.exports = {
    generateRecommendations,
};