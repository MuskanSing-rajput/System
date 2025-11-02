import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getStats = async (req, res) => {
  try {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const totalItems = await prisma.item.count({ where: { userId: req.userId } })
    const totalStock = await prisma.item.aggregate({
      where: { userId: req.userId },
      _sum: { stock: true },
    })

    const todaySales = await prisma.sale.aggregate({
      where: { userId: req.userId, saleDate: { gte: today } },
      _sum: { totalAmount: true },
      _count: true,
    })

    const todayPurchases = await prisma.purchase.aggregate({
      where: { userId: req.userId, purchaseDate: { gte: today } },
      _sum: { totalAmount: true },
      _count: true,
    })

    res.json({
      totalItems,
      totalStock: totalStock._sum.stock || 0,
      todaySales: todaySales._sum.totalAmount || 0,
      todayPurchases: todayPurchases._sum.totalAmount || 0,
      todaySalesCount: todaySales._count,
      todayPurchasesCount: todayPurchases._count,
    })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}
