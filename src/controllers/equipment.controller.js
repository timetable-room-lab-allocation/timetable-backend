const pool = require("../config/db");
const { successResponse } = require("../utils/apiResponse");

// GET /api/equipment
const getAllEquipment = async (req, res) => {
    try {
        const [equipment] = await pool.query(
            `
            SELECT
                id,
                name
            FROM equipment
            ORDER BY id
            `
        );

        return successResponse(
            res,
            200,
            "Equipment fetched successfully",
            equipment
        );
    } catch (error) {
        console.error("Get equipment error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch equipment"
        });
    }
};

// GET /api/equipment/:id
const getEquipmentById = async (req, res) => {
    try {
        const { id } = req.params;

        const [equipment] = await pool.query(
            `
            SELECT
                id,
                name
            FROM equipment
            WHERE id = ?
            `,
            [id]
        );

        if (equipment.length === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        return successResponse(
            res,
            200,
            "Equipment fetched successfully",
            equipment[0]
        );
    } catch (error) {
        console.error("Get equipment by id error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to fetch equipment"
        });
    }
};

// POST /api/equipment
const createEquipment = async (req, res) => {
    try {
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Equipment name is required"
            });
        }

        const [result] = await pool.query(
            `
            INSERT INTO equipment (name)
            VALUES (?)
            `,
            [name.trim()]
        );

        return successResponse(
            res,
            201,
            "Equipment created successfully",
            {
                equipmentId: result.insertId
            }
        );
    } catch (error) {
        console.error("Create equipment error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Equipment already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to create equipment"
        });
    }
};

// PUT /api/equipment/:id
const updateEquipment = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                message: "Equipment name is required"
            });
        }

        const [result] = await pool.query(
            `
            UPDATE equipment
            SET name = ?
            WHERE id = ?
            `,
            [name.trim(), id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        return successResponse(
            res,
            200,
            "Equipment updated successfully",
            {
                equipmentId: Number(id)
            }
        );
    } catch (error) {
        console.error("Update equipment error:", error);

        if (error.code === "ER_DUP_ENTRY") {
            return res.status(409).json({
                success: false,
                message: "Equipment already exists"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to update equipment"
        });
    }
};

// DELETE /api/equipment/:id
const deleteEquipment = async (req, res) => {
    try {
        const { id } = req.params;

        const [result] = await pool.query(
            `
            DELETE FROM equipment
            WHERE id = ?
            `,
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({
                success: false,
                message: "Equipment not found"
            });
        }

        return successResponse(
            res,
            200,
            "Equipment deleted successfully",
            {
                equipmentId: Number(id)
            }
        );
    } catch (error) {
        console.error("Delete equipment error:", error);

        if (error.code === "ER_ROW_IS_REFERENCED_2") {
            return res.status(409).json({
                success: false,
                message:
                    "Cannot delete equipment because it is being used by rooms or sections"
            });
        }

        return res.status(500).json({
            success: false,
            message: "Failed to delete equipment"
        });
    }
};

module.exports = {
    getAllEquipment,
    getEquipmentById,
    createEquipment,
    updateEquipment,
    deleteEquipment
};