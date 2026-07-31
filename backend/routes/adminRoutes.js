const express = require("express");
const { verifyToken } = require("../middleware/auth");
const { requireRole } = require("../middleware/roles");
const adminController = require("../controllers/adminController");

const router = express.Router();

router.use(verifyToken, requireRole("admin")); // every route below: admin-only

router.get("/users", adminController.listUsers);
router.post("/staff", adminController.createStaffAccount);
router.get("/audit-logs", adminController.getAuditLogs);

module.exports = router;
