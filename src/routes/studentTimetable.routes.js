const express = require("express");

const {
    getStudentTimetable
} = require("../controllers/studentTimetable.controller");

const router = express.Router();

router.get("/:studentGroupId", getStudentTimetable);

module.exports = router;