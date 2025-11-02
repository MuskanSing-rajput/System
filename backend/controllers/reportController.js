import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const getDailyReport = async (req, res) => {
  try {
    const { startDate, endDate } = req.query

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const sales = await prisma.sale.findMany({
      where: {
        userId: req.userId,
        saleDate: { gte: start, lte: end },
      },
    })

    const purchases = await prisma.purchase.findMany({
      where: {
        userId: req.userId,
        purchaseDate: { gte: start, lte: end },
      },
    })

    console.log("Sales found:", sales.length)
    console.log("Purchases found:", purchases.length)

    const totalSales = sales.reduce((sum, s) => sum + (s.totalAmount || s.amount || 0), 0)
    const totalPurchases = purchases.reduce((sum, p) => sum + (p.totalAmount || p.amount || 0), 0)

    const borrowSales = sales.filter(s => s.paymentType?.toLowerCase() === "borrow")
    const borrowPurchases = purchases.filter(p => p.paymentType?.toLowerCase() === "borrow")

    const totalBorrowSales = borrowSales.reduce((sum, s) => sum + (s.borrowAmount || s.borrow || 0), 0)
    const totalBorrowPurchases = borrowPurchases.reduce((sum, p) => sum + (p.borrowAmount || p.borrow || 0), 0)

    const grossProfit = totalSales - totalPurchases
    const netProfit = grossProfit

    res.json({
      totalSales,
      totalPurchases,
      totalExpenses: 0,
      grossProfit,
      netProfit,
      salesCount: sales.length,
      purchaseCount: purchases.length,
      expenseCount: 0,
      borrowDetails: {
        sales: { count: borrowSales.length, totalBorrow: totalBorrowSales },
        purchases: { count: borrowPurchases.length, totalBorrow: totalBorrowPurchases },
      },
    })
  } catch (error) {
    console.error(error)
    res.status(400).json({ error: error.message })
  }
}



