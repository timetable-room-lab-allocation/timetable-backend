const pool = require("../../config/db");
const { successResponse } = require("../utils/apiResponse");

// =========================================================
// Get All Allocations
// =========================================================

const getAllAllocations = async (req, res) => {
    try {
        const [allocations] = await pool.query(
            `SELECT
                a.id,
                a.section_id,
                s.name AS section_name,
                a.lecturer_id,
                l.name AS lecturer_name,
                a.room_id,
                r.name AS room_name,
                a.timeslot_id,
                t.day,
                t.start_time,
                t.end_time,
                a.score,
                a.status,
                a.created_at
             FROM allocations a
             JOIN sections s
                ON a.section_id = s.id
             JOIN lecturers l
                ON a.lecturer_id = l.id
            LEFT JOIN rooms r
    ON a.room_id = r.id

LEFT JOIN timeslots t
    ON a.timeslot_id = t.id
             ORDER BY a.id DESC`
        );

        return successResponse(
            res,
            200,
            "Allocations fetched successfully",
            allocations
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch allocations"
        });
    }
};


// =========================================================
// Get Allocation By ID
// =========================================================

const getAllocationById = async (req, res) => {
    try {
        const { id } = req.params;

        const [allocations] = await pool.query(
            `SELECT
                a.id,
                a.section_id,
                s.name AS section_name,
                a.lecturer_id,
                l.name AS lecturer_name,
                a.room_id,
                r.name AS room_name,
                a.timeslot_id,
                t.day,
                t.start_time,
                t.end_time,
                a.score,
                a.status,
                a.created_at
             FROM allocations a
             JOIN sections s
                ON a.section_id = s.id
             JOIN lecturers l
                ON a.lecturer_id = l.id
             LEFT JOIN rooms r
    ON a.room_id = r.id

LEFT JOIN timeslots t
    ON a.timeslot_id = t.id
             WHERE a.id = ?`,
            [id]
        );

        if (allocations.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });
        }

        return successResponse(
            res,
            200,
            "Allocation fetched successfully",
            allocations[0]
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch allocation"
        });
    }
};


// =========================================================
// Validate Approved Allocation
// =========================================================

const validateApprovedAllocation = async ({
    section_id,
    lecturer_id,
    room_id,
    timeslot_id,
    allocation_id = null
}) => {

    // -----------------------------------------------------
    // Get target section + student group + timeslot
    // -----------------------------------------------------

    const [targetRows] = await pool.query(
        `SELECT
            s.id AS section_id,
            s.student_group_id,
            sg.name AS student_group,
            t.id AS timeslot_id,
            t.day,
            t.start_time,
            t.end_time
         FROM sections s
         JOIN student_groups sg
            ON s.student_group_id = sg.id
         JOIN timeslots t
            ON t.id = ?
         WHERE s.id = ?`,
        [timeslot_id, section_id]
    );

    if (targetRows.length === 0) {
        return {
            valid: false,
            status: 404,
            message: "Section or timeslot not found"
        };
    }

    const target = targetRows[0];

    // -----------------------------------------------------
    // 1. Same Section already approved
    // -----------------------------------------------------

    const [sectionConflicts] = await pool.query(
        `SELECT
            a.id
         FROM allocations a
         WHERE a.section_id = ?
           AND a.status = 'Approved'
           ${allocation_id ? "AND a.id != ?" : ""}`,
        allocation_id
            ? [section_id, allocation_id]
            : [section_id]
    );

    if (sectionConflicts.length > 0) {
        return {
            valid: false,
            status: 409,
            message:
                "This section already has an approved allocation."
        };
    }

    // -----------------------------------------------------
    // 2. Same Room + Same Actual Timeslot
    // -----------------------------------------------------

    const [roomConflicts] = await pool.query(
        `SELECT
            a.id,
            s.name AS section_name,
            r.name AS room_name,
            t.day,
            t.start_time,
            t.end_time
         FROM allocations a

         JOIN sections s
            ON a.section_id = s.id

         JOIN rooms r
            ON a.room_id = r.id

         JOIN timeslots t
            ON a.timeslot_id = t.id

         WHERE a.room_id = ?
           AND a.status = 'Approved'
           AND t.day = ?
           AND t.start_time = ?
           AND t.end_time = ?
           ${allocation_id ? "AND a.id != ?" : ""}`,
        allocation_id
            ? [
                room_id,
                target.day,
                target.start_time,
                target.end_time,
                allocation_id
            ]
            : [
                room_id,
                target.day,
                target.start_time,
                target.end_time
            ]
    );

    if (roomConflicts.length > 0) {
        const conflict = roomConflicts[0];

        return {
            valid: false,
            status: 409,
            message:
                `Room ${conflict.room_name} is already assigned ` +
                `to ${conflict.section_name} at ` +
                `${conflict.day} ${conflict.start_time}-${conflict.end_time}.`
        };
    }

    // -----------------------------------------------------
    // 3. Same Lecturer + Same Actual Timeslot
    // -----------------------------------------------------

    const [lecturerConflicts] = await pool.query(
        `SELECT
            a.id,
            s.name AS section_name,
            l.name AS lecturer_name,
            t.day,
            t.start_time,
            t.end_time
         FROM allocations a

         JOIN sections s
            ON a.section_id = s.id

         JOIN lecturers l
            ON a.lecturer_id = l.id

         JOIN timeslots t
            ON a.timeslot_id = t.id

         WHERE a.lecturer_id = ?
           AND a.status = 'Approved'
           AND t.day = ?
           AND t.start_time = ?
           AND t.end_time = ?
           ${allocation_id ? "AND a.id != ?" : ""}`,
        allocation_id
            ? [
                lecturer_id,
                target.day,
                target.start_time,
                target.end_time,
                allocation_id
            ]
            : [
                lecturer_id,
                target.day,
                target.start_time,
                target.end_time
            ]
    );

    if (lecturerConflicts.length > 0) {
        const conflict = lecturerConflicts[0];

        return {
            valid: false,
            status: 409,
            message:
                `Lecturer ${conflict.lecturer_name} is already assigned ` +
                `to ${conflict.section_name} at ` +
                `${conflict.day} ${conflict.start_time}-${conflict.end_time}.`
        };
    }

    // -----------------------------------------------------
    // 4. Same Student Group + Same Actual Timeslot
    // -----------------------------------------------------

    const [groupConflicts] = await pool.query(
        `SELECT
            a.id,
            s2.name AS section_name,
            sg2.name AS student_group,
            t.day,
            t.start_time,
            t.end_time
         FROM allocations a

         JOIN sections s2
            ON a.section_id = s2.id

         JOIN student_groups sg2
            ON s2.student_group_id = sg2.id

         JOIN timeslots t
            ON a.timeslot_id = t.id

         WHERE s2.student_group_id = ?
           AND a.status = 'Approved'
           AND t.day = ?
           AND t.start_time = ?
           AND t.end_time = ?
           ${allocation_id ? "AND a.id != ?" : ""}`,
        allocation_id
            ? [
                target.student_group_id,
                target.day,
                target.start_time,
                target.end_time,
                allocation_id
            ]
            : [
                target.student_group_id,
                target.day,
                target.start_time,
                target.end_time
            ]
    );

    if (groupConflicts.length > 0) {
        const conflict = groupConflicts[0];

        return {
            valid: false,
            status: 409,
            message:
                `Student group ${conflict.student_group} is already assigned ` +
                `to ${conflict.section_name} at ` +
                `${conflict.day} ${conflict.start_time}-${conflict.end_time}.`
        };
    }

    return {
        valid: true
    };
};


// =========================================================
// Create Allocation
// =========================================================

const createAllocation = async (req, res) => {
    try {
        const {
            section_id,
            lecturer_id,
            room_id,
            timeslot_id,
            score,
            status
        } = req.body;

        const allocationStatus = status || "Draft";

        // -------------------------------------------------
        // Validate Approved allocation
        // -------------------------------------------------

        if (allocationStatus === "Approved") {

            const validation = await validateApprovedAllocation({
                section_id,
                lecturer_id,
                room_id,
                timeslot_id
            });

            if (!validation.valid) {
                return res.status(validation.status).json({
                    success: false,
                    message: validation.message
                });
            }
        }

        // -------------------------------------------------
        // Create
        // -------------------------------------------------

        const [result] = await pool.query(
            `INSERT INTO allocations
            (
                section_id,
                lecturer_id,
                room_id,
                timeslot_id,
                score,
                status
            )
            VALUES (?, ?, ?, ?, ?, ?)`,
            [
                section_id,
                lecturer_id,
                room_id,
                timeslot_id,
                score || 0,
                allocationStatus
            ]
        );

        return successResponse(
            res,
            201,
            "Allocation created successfully",
            {
                allocationId: result.insertId
            }
        );

    } catch (error) {
    console.error("CREATE ALLOCATION ERROR:", error);

    return res.status(500).json({
        success: false,
        message: "Failed to create allocation",
        error: error.message
    });
}
};


// =========================================================
// Update Allocation
// =========================================================

const updateAllocation = async (req, res) => {
    try {
        const { id } = req.params;

        const {
            section_id,
            lecturer_id,
            room_id,
            timeslot_id,
            score,
            status
        } = req.body;

        const allocationStatus = status || "Draft";

        // -------------------------------------------------
        // Validate Approved update
        // -------------------------------------------------

        if (allocationStatus === "Approved") {

            const validation = await validateApprovedAllocation({
                section_id,
                lecturer_id,
                room_id,
                timeslot_id,
                allocation_id: id
            });

            if (!validation.valid) {
                return res.status(validation.status).json({
                    success: false,
                    message: validation.message
                });
            }
        }

        // -------------------------------------------------
        // Update
        // -------------------------------------------------

        const [result] = await pool.query(
            `UPDATE allocations
             SET section_id = ?,
                 lecturer_id = ?,
                 room_id = ?,
                 timeslot_id = ?,
                 score = ?,
                 status = ?
             WHERE id = ?`,
            [
                section_id,
                lecturer_id,
                room_id,
                timeslot_id,
                score,
                allocationStatus,
                id
            ]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });
        }

        return successResponse(
            res,
            200,
            "Allocation updated successfully"
        );

    } catch (error) {
        console.error(error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message:
                    "This allocation conflicts with an existing allocation"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update allocation"
        });
    }
};


// =========================================================
// Delete Allocation
// =========================================================

const deleteAllocation = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            "DELETE FROM allocations WHERE id = ?",
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Allocation not found"
            });
        }

        return successResponse(
            res,
            200,
            "Allocation deleted successfully"
        );

    } catch (error) {
        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Failed to delete allocation"
        });
    }
};


module.exports = {
    getAllAllocations,
    getAllocationById,
    createAllocation,
    updateAllocation,
    deleteAllocation
};