import express from "express"
import { authenticate } from "../middleware/auth.js"
import {
  getAttendance,
  addAttendance,
  updateAttendance,
  deleteAttendance,
} from "../controllers/attendanceController.js"

const router = express.Router()

router.get("/", authenticate, getAttendance)
router.post("/", authenticate, addAttendance)
router.put("/:attendanceId", authenticate, updateAttendance)
router.delete("/:attendanceId", authenticate, deleteAttendance)

export default router
