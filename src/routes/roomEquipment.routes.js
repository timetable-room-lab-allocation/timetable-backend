const express = require("express");

const {
    getRoomEquipment,
    addRoomEquipment,
    removeRoomEquipment
} = require("../controllers/roomEquipment.controller");

const router = express.Router();

router.get("/:roomId/equipment", getRoomEquipment);

router.post("/:roomId/equipment", addRoomEquipment);

router.delete(
    "/:roomId/equipment/:equipmentId",
    removeRoomEquipment
);

module.exports = router;