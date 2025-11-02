import { prisma } from "../index.js"

// Get all expenses
export const getExpenses = async (req, res) => {
  try {
    const userId = req.userId
    const { startDate, endDate, category } = req.query

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    // Admin can see all expenses from all workers
    const where = {}

    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      }
    }

    if (category) {
      where.category = category
    }

    const expenses = await prisma.expense.findMany({
      where,
      include: { user: true },
      orderBy: { date: "desc" },
    })

    res.json(expenses)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Add expense
export const addExpense = async (req, res) => {
  try {
    const userId = req.userId
    const { title, description, amount, category, date, receipt } = req.body

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        title,
        description,
        amount: Number.parseFloat(amount),
        category,
        date: new Date(date),
        receipt,
      },
    })

    res.status(201).json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Update expense
export const updateExpense = async (req, res) => {
  try {
    const { expenseId } = req.params
    const userId = req.userId
    const { title, description, amount, category, date, receipt } = req.body

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    const expense = await prisma.expense.update({
      where: { id: expenseId },
      data: {
        title,
        description,
        amount: Number.parseFloat(amount),
        category,
        date: new Date(date),
        receipt,
      },
    })

    res.json(expense)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

// Delete expense
export const deleteExpense = async (req, res) => {
  try {
    const { expenseId } = req.params
    const userId = req.userId

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    await prisma.expense.delete({ where: { id: expenseId } })

    res.json({ message: "Expense deleted successfully" })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
