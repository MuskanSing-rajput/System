import express from "express"
import { createPurchase, getPurchases,updatePurchase } from "../controllers/purchaseController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post("/", authMiddleware, createPurchase)
router.get("/", authMiddleware, getPurchases)
router.put("/:id", authMiddleware, updatePurchase)

export default router
