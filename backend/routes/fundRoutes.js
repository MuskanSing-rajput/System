import express from "express"
import { addWorkerFund, getWorkerFund } from "../controllers/fundController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post("/", authMiddleware, addWorkerFund)
router.get("/", authMiddleware, getWorkerFund)

export default router
