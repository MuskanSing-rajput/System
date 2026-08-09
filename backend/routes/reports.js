import express from "express"
import { getDailyReport } from "../controllers/reportController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.get("/daily", authMiddleware, getDailyReport)

export default router
