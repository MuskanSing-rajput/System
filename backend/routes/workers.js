import express from "express"
import { authenticate } from "../middleware/auth.js"
import { getAllWorkers, getWorkerById, addWorker, updateWorker, deleteWorker } from "../controllers/workerController.js"

const router = express.Router()

router.get("/", authenticate, getAllWorkers)
router.get("/:workerId", authenticate, getWorkerById)
router.post("/", authenticate, addWorker)
router.put("/:workerId", authenticate, updateWorker)
router.delete("/:workerId", authenticate, deleteWorker)

export default router
