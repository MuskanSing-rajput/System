import express from "express"
import { createSale, getSales,updateSale,payBorrowSale,deleteSale } from "../controllers/saleController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post("/", authMiddleware, createSale)
router.get("/", authMiddleware, getSales)
router.put("/:id", authMiddleware, updateSale)
router.put("/:id/pay-borrow", payBorrowSale);
router.delete("/:id", authMiddleware, deleteSale);

export default router
