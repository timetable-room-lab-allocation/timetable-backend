const pool = require("../config/db");

// GET /api/sections/:sectionId/equipment
const getSectionEquipment = async (req, res) => {
    try {
        const { sectionId } = req.params;

        const [rows] = await pool.query(
            `
            SELECT
                e.id,
                e.name
            FROM section_equipment se
            JOIN equipment e
                ON e.id = se.equipment_id
            WHERE se.section_id = ?
            ORDER BY e.name
            `,
            [sectionId]
        );

        return res.json({
            success: true,
            data: rows
        });

    } catch (error) {
        console.error("Get section equipment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch section equipment"
        });
    }
};


// POST /api/sections/:sectionId/equipment
const addSectionEquipment = async (req, res) => {
    try {
        const { sectionId } = req.params;
        const { equipment_id } = req.body;

        if (!equipment_id) {
            return res.status(400).json({
                success: false,
                message: "equipment_id is required"
            });
        }

        // Check section
        const [sections] = await pool.query(
            "SELECT id FROM sections WHERE id = ?",
            [sectionId]
        );

        if (sections.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Section not found"
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
            SELECT section_id
            FROM section_equipment
            WHERE section_id = ?
              AND equipment_id = ?
            `,
            [sectionId, equipment_id]
        );

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: "Equipment already assigned to this section"
            });
        }

        await pool.query(
            `
            INSERT INTO section_equipment (section_id, equipment_id)
            VALUES (?, ?)
            `,
            [sectionId, equipment_id]
        );

        return res.status(201).json({
            success: true,
            message: "Equipment assigned to section successfully"
        });

    } catch (error) {
        console.error("Add section equipment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to assign equipment to section"
        });
    }
};


// DELETE /api/sections/:sectionId/equipment/:equipmentId
const removeSectionEquipment = async (req, res) => {
    try {
        const { sectionId, equipmentId } = req.params;

        const [result] = await pool.query(
            `
            DELETE FROM section_equipment
            WHERE section_id = ?
              AND equipment_id = ?
            `,
            [sectionId, equipmentId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment assignment not found"
            });
        }

        return res.json({
            success: true,
            message: "Equipment removed from section successfully"
        });

    } catch (error) {
        console.error("Remove section equipment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to remove equipment from section"
        });
    }
};


module.exports = {
    getSectionEquipment,
    addSectionEquipment,
    removeSectionEquipment
};