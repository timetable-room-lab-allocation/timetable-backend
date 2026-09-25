const cors = require("cors");
const express = require("express");
const pool = require("../config/db");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./docs/swagger");

const roomRoutes = require("./routes/room.routes");
const lecturerAvailabilityRoutes = require("./routes/lecturerAvailability.routes");
const lecturerRoutes = require("./routes/lecturer.routes");
const courseRoutes = require("./routes/course.routes");
const studentGroupRoutes = require("./routes/studentGroup.routes");
const equipmentRoutes = require("./routes/equipment.routes");
const timeslotRoutes = require("./routes/timeslot.routes");
const sectionRoutes = require("./routes/section.routes");
const allocationRoutes = require("./routes/allocation.routes");
const aiRoutes = require("./routes/ai.routes");

const { testFastAPI } = require("./services/fastapi.service");

const notFound = require("./middleware/notFound");
const errorHandler = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const studentTimetableRoutes = require("./routes/studentTimetable.routes");

const roomEquipmentRoutes = require("./routes/roomEquipment.routes");
const sectionEquipmentRoutes = require("./routes/sectionEquipment.routes");

const app = express();

// =========================
// CORS Middleware
// =========================

const allowedOrigins = [
    "https://timetable-frontend-p0e1gc5ys-modyelansarys-projects.vercel.app",
    "https://timetable-frontend-4ld77avoy-modyelansarys-projects.vercel.app",
    "https://timetable-frontend-nzkrjxqz1-modyelansarys-projects.vercel.app",
    "https://timetable-frontend-o8qf0d6kn-modyelansarys-projects.vercel.app",
    "https://timetable-frontend-25pjvr9oy-modyelansarys-projects.vercel.app",
    "https://timetable-frontend-five.vercel.app",
    "http://localhost:5173",
];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests without Origin
            if (!origin) {
                return callback(null, true);
            }

            // Allow all localhost ports
            if (/^https?:\/\/localhost:\d+$/.test(origin)) {
                return callback(null, true);
            }

            // Allow configured production origins
            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(
                new Error(`Not allowed by CORS: ${origin}`)
            );
        },

        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

        allowedHeaders: ["Content-Type", "Authorization"],

        credentials: true
    })
);

app.use(cors({
    origin: function (origin, callback) {

        // Allow requests without Origin
        if (!origin) {
            return callback(null, true);
        }

        // Allow all localhost ports during local development
        if (/^http:\/\/localhost:\d+$/.test(origin)) {
            return callback(null, true);
        }

        // Allow configured production origins
        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(new Error(`Not allowed by CORS: ${origin}`));
    },

    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization"],

    credentials: true
}));

// =========================
// JSON Middleware
// =========================

app.use(express.json());

// =========================
// Authentication Routes
// =========================

app.use("/api/auth", authRoutes);

// =========================
// Swagger API Documentation
// =========================

app.use(
    "/api-docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);

// =========================
// Main API Routes
// =========================

app.use("/api/allocations", allocationRoutes);

app.use("/api/ai", aiRoutes);

app.use("/api/sections", sectionRoutes);

app.use("/api/rooms", roomRoutes);

app.use("/api/lecturers", lecturerRoutes);

app.use(
    "/api/lecturer-availability",
    lecturerAvailabilityRoutes
);

app.use("/api/courses", courseRoutes);

app.use("/api/student-groups", studentGroupRoutes);

app.use("/api/equipment", equipmentRoutes);

app.use("/api/timeslots", timeslotRoutes);

app.use("/api/rooms", roomEquipmentRoutes);

app.use("/api/sections", sectionEquipmentRoutes);

app.use(
    "/api/student-timetable",
    studentTimetableRoutes
);

// =========================
// Root Route
// =========================

app.get("/", (req, res) => {
    res.json({
        message: "Timetable Backend API is running"
    });
});

// =========================
// Health Check - Backend
// =========================

app.get("/api/health", (req, res) => {
    res.json({
        status: "ok",
        service: "backend"
    });
});

// =========================
// Health Check - Database
// =========================

app.get("/api/health/db", async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT 1 AS ok");

        res.json({
            database: "connected",
            result: rows[0]
        });
    } catch (error) {
        console.error(error);

        res.status(500).json({
            database: "error",
            message: error.message
        });
    }
});

// =========================
// Health Check - FastAPI
// =========================

app.get("/api/health/fastapi", async (req, res) => {
    try {
        const data = await testFastAPI();

        res.json({
            fastapi: "connected",
            response: data
        });
    } catch (error) {
        console.error("FastAPI health check error:", error);

        res.status(500).json({
            fastapi: "error",
            message: error.message
        });
    }
});

// =========================
// 404 Handler
// =========================

app.use(notFound);

// =========================
// Global Error Handler
// =========================

app.use(errorHandler);

module.exports = app;
