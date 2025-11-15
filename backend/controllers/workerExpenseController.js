import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

// Add expense for worker (deduct from fund)
export const addWorkerExpense = async (req, res) => {
  try {
    const userId = req.userId;
    const { title, amount } = req.body;

    if (!title || !amount) {
      return res.status(400).json({ error: "Title and amount are required" });
    }

    const worker = await prisma.worker.findFirst({
      where: { userId },
      include: { user: true },
    });

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const shopId = worker.user.shopId;
    if (!shopId) {
      return res.status(400).json({ error: "Worker not linked to any shop" });
    }

    // Fetch ALL funds of this shop
    const funds = await prisma.workerFund.findMany({
      where: { shopId },
    });

    if (funds.length === 0) {
      return res.status(400).json({ error: "No fund found for this shop" });
    }

    // Calculate total remaining
    const totalRemaining = funds.reduce(
      (sum, f) => sum + (f.remainingAmount || 0),
      0
    );

    if (totalRemaining < amount) {
      return res.status(400).json({ error: "Insufficient fund balance" });
    }

    // Deduct amount from latest fund (FIFO)
    const latestFund = await prisma.workerFund.findFirst({
      where: { shopId },
      orderBy: { createdAt: "desc" },
    });

    await prisma.workerFund.update({
      where: { id: latestFund.id },
      data: {
        remainingAmount: latestFund.remainingAmount - parseFloat(amount),
      },
    });

    // Save worker expense record
    const expense = await prisma.workerExpense.create({
      data: {
        workerId: worker.id,
        title,
        amount: parseFloat(amount),
      },
    });

    // ⬇️ Recalculate actual remaining balance after update
    const allFundsAfterUpdate = await prisma.workerFund.findMany({
      where: { shopId },
    });

    const newTotalRemaining = allFundsAfterUpdate.reduce(
      (sum, f) => sum + (f.remainingAmount || 0),
      0
    );

    // Return correct balance
    res.json({
      message: "Expense added successfully",
      expense,
      remainingFund: newTotalRemaining,
    });

  } catch (error) {
    console.error("Worker expense error:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getWorkerExpenses = async (req, res) => {
  try {
    const userId = req.userId;

    const worker = await prisma.worker.findFirst({
      where: { userId },
    });

    if (!worker) {
      return res.status(404).json({ error: "Worker not found" });
    }

    const expenses = await prisma.workerExpense.findMany({
      where: { workerId: worker.id },
      orderBy: { date: "desc" },
    });

    res.json(expenses);

  } catch (error) {
    console.error("Get worker expenses error:", error);
    res.status(500).json({ error: error.message });
  }
};
