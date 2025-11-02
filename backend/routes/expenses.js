import express from "express"
import { authenticate } from "../middleware/auth.js"
import { getExpenses, addExpense, updateExpense, deleteExpense } from "../controllers/expenseController.js"

const router = express.Router()

router.get("/", authenticate, getExpenses)
router.post("/", authenticate, addExpense)
router.put("/:expenseId", authenticate, updateExpense)
router.delete("/:expenseId", authenticate, deleteExpense)

export default router
