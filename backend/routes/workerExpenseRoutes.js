import express from "express"
import { addWorkerExpense, getWorkerExpenses } from "../controllers/workerExpenseController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

// Worker adds an expense (deduct from fund)
router.post("/", authMiddleware, addWorkerExpense)

// Fetch all expenses of logged-in worker
router.get("/", authMiddleware, getWorkerExpenses)

export default router
