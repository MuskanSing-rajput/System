import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

// Add expense for worker (deduct from fund)
export const addWorkerExpense = async (req, res) => {
  try {
    const userId = req.userId
    const { title, amount } = req.body

    if (!title || !amount) {
      return res.status(400).json({ error: "Title and amount are required" })
    }

    // Find worker and their shop
    const worker = await prisma.worker.findFirst({
      where: { userId },
      include: { user: true },
    })

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" })
    }

    const shopId = worker.user.shopId
    if (!shopId) {
      return res.status(400).json({ error: "Worker not linked to any shop" })
    }

    // Find fund for this shop
    const fund = await prisma.workerFund.findFirst({
      where: { shopId },
    })

    if (!fund) {
      return res.status(400).json({ error: "No fund found for this shop" })
    }

    if (fund.remainingAmount < amount) {
      return res.status(400).json({ error: "Insufficient fund balance" })
    }

    // Deduct from remaining fund
    const updatedFund = await prisma.workerFund.update({
      where: { id: fund.id },
      data: {
        remainingAmount: fund.remainingAmount - parseFloat(amount),
      },
    })

    // Record the worker expense
    const expense = await prisma.workerExpense.create({
      data: {
        workerId: worker.id, // ✅ use worker.id not userId
        title,
        amount: parseFloat(amount),
      },
    })

    res.json({
      message: "Expense added successfully",
      expense,
      remainingFund: updatedFund.remainingAmount,
    })
  } catch (error) {
    console.error("Worker expense error:", error)
    res.status(500).json({ error: error.message })
  }
}





// Fetch all expenses for logged-in worker
export const getWorkerExpenses = async (req, res) => {
  try {
    const userId = req.userId

    const expenses = await prisma.workerExpense.findMany({
      where: { workerId: userId },
      orderBy: { date: "desc" },
    })

    res.json(expenses)
  } catch (error) {
    console.error("Get worker expenses error:", error)
    res.status(500).json({ error: error.message })
  }
}
