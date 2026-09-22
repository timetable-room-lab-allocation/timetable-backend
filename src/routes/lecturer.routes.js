const express = require("express");

const {
    getAllLecturers,
    getLecturerById,
    createLecturer,
    updateLecturer,
    deleteLecturer
} = require("../controllers/lecturer.controller");

const validateLecturer = require("../middleware/lecturer.validation");

const router = express.Router();

router.get("/", getAllLecturers);

router.get("/:id", getLecturerById);

router.post("/", validateLecturer, createLecturer);

router.put("/:id", validateLecturer, updateLecturer);

router.delete("/:id", deleteLecturer);

module.exports = router;