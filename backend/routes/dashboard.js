import express from "express"
import { getStats } from "../controllers/dashboardController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.get("/stats", authMiddleware, getStats)

export default router
