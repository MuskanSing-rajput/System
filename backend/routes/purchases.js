import express from "express"
import { createPurchase, getPurchases,updatePurchase,payBorrowAmount,deletePurchase } from "../controllers/purchaseController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post("/", authMiddleware, createPurchase)
router.get("/", authMiddleware, getPurchases)
router.put("/:id", authMiddleware, updatePurchase)
router.put("/:id/pay-borrow", payBorrowAmount); 
router.delete("/:id", authMiddleware, deletePurchase);

export default router
