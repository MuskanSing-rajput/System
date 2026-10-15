import express from "express"
import { authenticate } from "../middleware/auth.js"
import { getProfitLossSummary, getDailyReport, generateExcelReport, getDashboardOverview } from "../controllers/adminReportController.js"

const router = express.Router()

router.get("/dashboard-overview", authenticate, getDashboardOverview)
router.get("/profit-loss", authenticate, getProfitLossSummary)
router.get("/daily", authenticate, getDailyReport)
router.get("/excel", authenticate, generateExcelReport)

export default router
