const express = require("express");

const {
    getSectionEquipment,
    addSectionEquipment,
    removeSectionEquipment
} = require("../controllers/sectionEquipment.controller");

const router = express.Router();

router.get("/:sectionId/equipment", getSectionEquipment);

router.post("/:sectionId/equipment", addSectionEquipment);

router.delete(
    "/:sectionId/equipment/:equipmentId",
    removeSectionEquipment
);

module.exports = router;