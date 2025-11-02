import express from "express"
import { createSale, getSales,updateSale } from "../controllers/saleController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post("/", authMiddleware, createSale)
router.get("/", authMiddleware, getSales)
router.put("/:id", authMiddleware, updateSale)

export default router
