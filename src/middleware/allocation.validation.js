const validateAllocation = (req, res, next) => {
    const {
        section_id,
        lecturer_id,
        room_id,
        timeslot_id,
        score,
        status
    } = req.body;

    const errors = [];

    const allocationStatus = status || "Draft";

    // =====================================================
    // Required IDs
    // =====================================================

    const requiredIds = [
        ["section_id", section_id],
        ["lecturer_id", lecturer_id]
    ];

    requiredIds.forEach(([field, value]) => {
        if (value === undefined || value === null) {
            errors.push(`${field} is required`);
        } else if (
            !Number.isInteger(Number(value)) ||
            Number(value) <= 0
        ) {
            errors.push(`${field} must be a positive integer`);
        }
    });

    // =====================================================
    // Room + Timeslot
    // Draft allocations can be unassigned
    // Approved allocations must have both
    // =====================================================

    if (allocationStatus === "Approved") {

        if (room_id === undefined || room_id === null) {
            errors.push("room_id is required for Approved allocation");
        } else if (
            !Number.isInteger(Number(room_id)) ||
            Number(room_id) <= 0
        ) {
            errors.push(
                "room_id must be a positive integer"
            );
        }

        if (
            timeslot_id === undefined ||
            timeslot_id === null
        ) {
            errors.push(
                "timeslot_id is required for Approved allocation"
            );
        } else if (
            !Number.isInteger(Number(timeslot_id)) ||
            Number(timeslot_id) <= 0
        ) {
            errors.push(
                "timeslot_id must be a positive integer"
            );
        }

    } else {

        // Draft / other statuses:
        // null is allowed, but if a value exists,
        // it must be a positive integer.

        if (
            room_id !== undefined &&
            room_id !== null &&
            (
                !Number.isInteger(Number(room_id)) ||
                Number(room_id) <= 0
            )
        ) {
            errors.push(
                "room_id must be a positive integer"
            );
        }

        if (
            timeslot_id !== undefined &&
            timeslot_id !== null &&
            (
                !Number.isInteger(Number(timeslot_id)) ||
                Number(timeslot_id) <= 0
            )
        ) {
            errors.push(
                "timeslot_id must be a positive integer"
            );
        }
    }

    // =====================================================
    // Score
    // =====================================================

    if (score !== undefined && score !== null) {
        if (
            isNaN(Number(score)) ||
            Number(score) < 0 ||
            Number(score) > 100
        ) {
            errors.push(
                "score must be a number between 0 and 100"
            );
        }
    }

    // =====================================================
    // Status
    // =====================================================

    const allowedStatuses = [
        "Draft",
        "Approved",
        "Rejected"
    ];

    if (
        status !== undefined &&
        status !== null &&
        !allowedStatuses.includes(status)
    ) {
        errors.push(
            "status must be Draft, Approved, or Rejected"
        );
    }

    // =====================================================
    // Return validation errors
    // =====================================================

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors
        });
    }

    next();
};

module.exports = validateAllocation;