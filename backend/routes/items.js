import express from "express"
import { createItem, getItems, getItemById, updateItem,getItemNamesAndStock } from "../controllers/itemController.js"
import { authMiddleware } from "../middleware/auth.js"

const router = express.Router()

router.post("/", authMiddleware, createItem)
router.get("/", authMiddleware, getItems)
router.get("/item-name",authMiddleware, getItemNamesAndStock)
router.get("/:id", authMiddleware, getItemById)
router.put("/:id", authMiddleware, updateItem)


export default router
