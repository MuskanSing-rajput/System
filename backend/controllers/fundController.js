import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

// Owner gives amount to a shop (not just one worker)
export const addWorkerFund = async (req, res) => {
  try {
    const { amount, givenBy } = req.body
    const userId = req.userId // logged-in user's ID

    // find the worker for this user, include related user to access shopId
    const worker = await prisma.worker.findFirst({
      where: { userId },
      include: { user: true },
    })
    if (!worker) return res.status(404).json({ error: "Worker not found" })

    // find the shop this worker belongs to
    const shopId = worker.user.shopId
    if (!shopId) return res.status(400).json({ error: "Worker not linked to any shop" })

    // find admin
    const owner = await prisma.user.findFirst({ where: { role: "admin" } })
    if (!owner) return res.status(404).json({ error: "Owner not found" })

    // create or update fund for the shop
    const existingFund = await prisma.workerFund.findFirst({ where: { shopId } })

    let fund
    if (existingFund) {
      fund = await prisma.workerFund.update({
        where: { id: existingFund.id },
        data: {
          givenAmount: { increment: parseFloat(amount) },
          remainingAmount: { increment: parseFloat(amount) },
        },
      })
    } else {
      fund = await prisma.workerFund.create({
        data: {
          shopId,
          ownerId: owner.id,
          givenAmount: parseFloat(amount),
          remainingAmount: parseFloat(amount),
          givenBy,
        },
      })
    }

    res.json(fund)
  } catch (err) {
    console.error(err)
    res.status(400).json({ error: err.message })
  }
}



export const getWorkerFund = async (req, res) => {
  try {
    const userId = req.userId
    const worker = await prisma.worker.findFirst({
      where: { userId },
      include: { user: true },
    })

    if (!worker) return res.status(404).json({ error: "Worker not found" })
    if (!worker.user.shopId) return res.status(400).json({ error: "Worker not linked to any shop" })

    const fund = await prisma.workerFund.findFirst({
      where: { shopId: worker.user.shopId },
      orderBy: { createdAt: "desc" },
    })

    res.json(fund || { remainingAmount: 0 })
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}
