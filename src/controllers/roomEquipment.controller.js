const pool = require("../config/db");

// GET /api/rooms/:roomId/equipment
const getRoomEquipment = async (req, res) => {
    try {
        const { roomId } = req.params;

        const [rows] = await pool.query(
            `
            SELECT
                e.id,
                e.name
            FROM room_equipment re
            JOIN equipment e
                ON e.id = re.equipment_id
            WHERE re.room_id = ?
            ORDER BY e.name
            `,
            [roomId]
        );

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Get room equipment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch room equipment"
        });
    }
};


// POST /api/rooms/:roomId/equipment
const addRoomEquipment = async (req, res) => {
    try {
        const { roomId } = req.params;
        const { equipment_id } = req.body;

        if (!equipment_id) {
            return res.status(400).json({
                success: false,
                message: "equipment_id is required"
            });
        }

        // Check room
        const [rooms] = await pool.query(
            "SELECT id FROM rooms WHERE id = ?",
            [roomId]
        );

        if (rooms.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Room not found"
            });
        }

        // Check equipment
        const [equipment] = await pool.query(
            "SELECT id, name FROM equipment WHERE id = ?",
            [equipment_id]
        );

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        // Check duplicate
        const [existing] = await pool.query(
            `
            SELECT room_id
            FROM room_equipment
            WHERE room_id = ?
              AND equipment_id = ?
            `,
            [roomId, equipment_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Equipment already assigned to this room"
            });
        }

        await pool.query(
            `
            INSERT INTO room_equipment (room_id, equipment_id)
            VALUES (?, ?)
            `,
            [roomId, equipment_id]
        );

        return res.status(201).json({
            success: true,
            message: "Equipment assigned to room successfully"
        });

    } catch (error) {
        console.error("Add room equipment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign equipment to room"
        });
    }
};


// DELETE /api/rooms/:roomId/equipment/:equipmentId
const removeRoomEquipment = async (req, res) => {
    try {
        const { roomId, equipmentId } = req.params;

        const [result] = await pool.query(
            `
            DELETE FROM room_equipment
            WHERE room_id = ?
              AND equipment_id = ?
            `,
            [roomId, equipmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment assignment not found"
            });
        }

        return res.json({
            success: true,
            message: "Equipment removed from room successfully"
        });

    } catch (error) {
        console.error("Remove room equipment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove equipment from room"
        });
    }
};


module.exports = {
    getRoomEquipment,
    addRoomEquipment,
    removeRoomEquipment
};