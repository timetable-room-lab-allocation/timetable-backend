const express = require("express");

const {
    getLecturerAvailability,
    setLecturerAvailability
} = require("../controllers/lecturerAvailability.controller");

const router = express.Router();

router.get("/:lecturerId", getLecturerAvailability);

router.put("/:lecturerId", setLecturerAvailability);

module.exports = router;