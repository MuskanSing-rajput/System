import { prisma } from "../index.js"
import ExcelJS from "exceljs"


export const getProfitLossSummary = async (req, res) => {
  try {
    const userId = req.userId;
    const { startDate, endDate } = req.query;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const [
      salesAgg,
      purchasesAgg,
      expensesAgg,
      saleBorrowsAgg,
      purchaseBorrowsAgg,
      funds,
      workerExpenses,
    ] = await Promise.all([
      prisma.sale.aggregate({
        where: { saleDate: { gte: start, lte: end } },
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      prisma.purchase.aggregate({
        where: { purchaseDate: { gte: start, lte: end } },
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: { date: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
      }),
      prisma.sale.aggregate({
        where: { saleDate: { gte: start, lte: end }, paymentType: "borrow" },
        _sum: { borrowAmount: true },
        _count: { id: true },
      }),
      prisma.purchase.aggregate({
        where: { purchaseDate: { gte: start, lte: end }, paymentType: "borrow" },
        _sum: { borrowAmount: true },
        _count: { id: true },
      }),
      prisma.workerFund.findMany({
        where: { createdAt: { gte: start, lte: end } },
        select: {
          id: true,
          shopId: true,
          givenBy: true,
          givenAmount: true,
          remainingAmount: true,
          createdAt: true,
          owner: { select: { name: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.workerExpense.findMany({
        where: { date: { gte: start, lte: end } },
        select: {
          id: true,
          title: true,
          amount: true,
          date: true,
          worker: { select: { name: true } },
        },
        orderBy: { date: "desc" },
      }),
    ]);

    // Totals via DB aggregations
    const totalSales = salesAgg._sum.totalAmount || 0;
    const totalSaleQuantity = salesAgg._sum.quantity || 0;
    const salesCount = salesAgg._count.id || 0;

    const totalPurchases = purchasesAgg._sum.totalAmount || 0;
    const totalPurchaseQuantity = purchasesAgg._sum.quantity || 0;
    const purchaseCount = purchasesAgg._count.id || 0;

    const totalGeneralExpenses = expensesAgg._sum.amount || 0;
    const totalWorkerExpenses = workerExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalExpenses = totalGeneralExpenses + totalWorkerExpenses;
    const expenseCount = (expensesAgg._count.id || 0) + workerExpenses.length;

    const grossProfit = totalSales - totalPurchases;
    const netProfit = grossProfit - totalExpenses;

    const borrowSalesTotal = saleBorrowsAgg._sum.borrowAmount || 0;
    const borrowPurchasesTotal = purchaseBorrowsAgg._sum.borrowAmount || 0;
    const totalFundsGiven = funds.reduce((sum, f) => sum + (f.givenAmount || 0), 0);

    res.json({
      totalSales,
      totalPurchases,
      totalExpenses,
      grossProfit,
      netProfit,
      salesCount,
      purchaseCount,
      expenseCount,
      totalSaleQuantity,
      totalPurchaseQuantity,
      borrowDetails: {
        sales: { totalBorrow: borrowSalesTotal, count: saleBorrowsAgg._count.id || 0 },
        purchases: { totalBorrow: borrowPurchasesTotal, count: purchaseBorrowsAgg._count.id || 0 },
      },
      fundDetails: {
        totalFundsGiven,
        count: funds.length,
        transactions: funds.map((f) => ({
          id: f.id,
          shopId: f.shopId || "-",
          givenBy: f.givenBy,
          ownerName: f.owner?.name || "Unknown",
          givenAmount: f.givenAmount,
          remainingAmount: f.remainingAmount,
          date: f.createdAt,
        })),
      },
      workerExpenseDetails: {
        totalWorkerExpenses,
        count: workerExpenses.length,
        transactions: workerExpenses.map((e) => ({
          id: e.id,
          workerName: e.worker?.name || "Unknown",
          title: e.title,
          amount: e.amount,
          date: e.date,
        })),
      },
    });
  } catch (error) {
    console.error("❌ Error in getProfitLossSummary:", error);
    res.status(500).json({ error: error.message });
  }
};

export const getDailyReport = async (req, res) => {
  try {
    const userId = req.userId;
    const { date, shopId } = req.query;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    // Build where clause - admin sees all workers' data, optionally filtered by shop
    let userIds = null;
    if (shopId && shopId !== "all") {
      const users = await prisma.user.findMany({
        where: { shopId, role: "worker" },
        select: { id: true },
      });
      userIds = users.map((u) => u.id);
      if (userIds.length === 0) {
        return res.json({
          date,
          sales: [],
          purchases: [],
          expenses: [],
          totalSales: 0,
          totalPurchases: 0,
          totalExpenses: 0,
          profit: 0,
          totalSaleQuantity: 0,
          totalPurchaseQuantity: 0,
        });
      }
    }

    const buildWhere = (dateField) => {
      const where = { [dateField]: { gte: startDate, lt: endDate } };
      if (userIds) {
        where.userId = { in: userIds };
      }
      return where;
    };

    const [salesAgg, purchasesAgg, expensesAgg] = await Promise.all([
      prisma.sale.aggregate({
        where: buildWhere("saleDate"),
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      prisma.purchase.aggregate({
        where: buildWhere("purchaseDate"),
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      prisma.expense.aggregate({
        where: buildWhere("date"),
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    const totalSales = salesAgg._sum.totalAmount || 0;
    const totalPurchases = purchasesAgg._sum.totalAmount || 0;
    const totalExpenses = expensesAgg._sum.amount || 0;
    const totalSaleQuantity = salesAgg._sum.quantity || 0;
    const totalPurchaseQuantity = purchasesAgg._sum.quantity || 0;
    const salesCount = salesAgg._count.id || 0;
    const purchasesCount = purchasesAgg._count.id || 0;
    const expensesCount = expensesAgg._count.id || 0;

    res.json({
      date,
      sales: new Array(salesCount),
      salesCount,
      purchases: new Array(purchasesCount),
      purchasesCount,
      expenses: new Array(expensesCount),
      expensesCount,
      totalSales,
      totalPurchases,
      totalExpenses,
      profit: totalSales - totalPurchases - totalExpenses,
      totalSaleQuantity,
      totalPurchaseQuantity,
    });
  } catch (error) {
    console.error("❌ Error in getDailyReport:", error);
    res.status(500).json({ error: error.message });
  }
};

// Combined Dashboard Overview (Overall stats + all shop performance in one single request)
export const getDashboardOverview = async (req, res) => {
  try {
    const userId = req.userId;
    const { date, shopId = "all" } = req.query;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" });
    }

    let startDate, endDate;
    if (date) {
      startDate = new Date(date);
      endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);
    } else {
      const todayStr = new Date().toISOString().split("T")[0];
      startDate = new Date(todayStr);
      endDate = new Date(todayStr);
      endDate.setDate(endDate.getDate() + 1);
    }

    // 1. Fetch worker user to shop mappings
    const workers = await prisma.user.findMany({
      where: { role: "worker" },
      select: { id: true, shopId: true },
    });

    const userToShopMap = {};
    const knownShops = ["shop1", "shop2", "shop3", "shop4"];
    const shopStats = {};

    for (const s of knownShops) {
      shopStats[s] = {
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        profit: 0,
        totalSaleQuantity: 0,
        totalPurchaseQuantity: 0,
        salesCount: 0,
        purchasesCount: 0,
        expensesCount: 0,
      };
    }

    for (const w of workers) {
      if (w.shopId) {
        userToShopMap[w.id] = w.shopId;
        if (!shopStats[w.shopId]) {
          shopStats[w.shopId] = {
            totalSales: 0,
            totalPurchases: 0,
            totalExpenses: 0,
            profit: 0,
            totalSaleQuantity: 0,
            totalPurchaseQuantity: 0,
            salesCount: 0,
            purchasesCount: 0,
            expensesCount: 0,
          };
        }
      }
    }

    // 2. Fetch aggregated sales, purchases, and expenses grouped by userId in parallel
    const [salesByWorker, purchasesByWorker, expensesByWorker] = await Promise.all([
      prisma.sale.groupBy({
        by: ["userId"],
        where: { saleDate: { gte: startDate, lt: endDate } },
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      prisma.purchase.groupBy({
        by: ["userId"],
        where: { purchaseDate: { gte: startDate, lt: endDate } },
        _sum: { totalAmount: true, quantity: true },
        _count: { id: true },
      }),
      prisma.expense.groupBy({
        by: ["userId"],
        where: { date: { gte: startDate, lt: endDate } },
        _sum: { amount: true },
        _count: { id: true },
      }),
    ]);

    // 3. Map group sums to each shop
    for (const s of salesByWorker) {
      const shop = userToShopMap[s.userId];
      if (shop && shopStats[shop]) {
        shopStats[shop].totalSales += s._sum.totalAmount || 0;
        shopStats[shop].totalSaleQuantity += s._sum.quantity || 0;
        shopStats[shop].salesCount += s._count.id || 0;
      }
    }

    for (const p of purchasesByWorker) {
      const shop = userToShopMap[p.userId];
      if (shop && shopStats[shop]) {
        shopStats[shop].totalPurchases += p._sum.totalAmount || 0;
        shopStats[shop].totalPurchaseQuantity += p._sum.quantity || 0;
        shopStats[shop].purchasesCount += p._count.id || 0;
      }
    }

    for (const e of expensesByWorker) {
      const shop = userToShopMap[e.userId];
      if (shop && shopStats[shop]) {
        shopStats[shop].totalExpenses += e._sum.amount || 0;
        shopStats[shop].expensesCount += e._count.id || 0;
      }
    }

    // Compute profit per shop
    for (const s of Object.keys(shopStats)) {
      shopStats[s].profit =
        shopStats[s].totalSales -
        shopStats[s].totalPurchases -
        shopStats[s].totalExpenses;
    }

    // 4. Calculate stats for the selected shop (or overall)
    let totalSales = 0;
    let totalSaleQuantity = 0;
    let salesCount = 0;

    let totalPurchases = 0;
    let totalPurchaseQuantity = 0;
    let purchasesCount = 0;

    let totalExpenses = 0;
    let expensesCount = 0;

    if (shopId && shopId !== "all") {
      const selectedData = shopStats[shopId] || {
        totalSales: 0,
        totalPurchases: 0,
        totalExpenses: 0,
        profit: 0,
        totalSaleQuantity: 0,
        totalPurchaseQuantity: 0,
        salesCount: 0,
        purchasesCount: 0,
        expensesCount: 0,
      };
      totalSales = selectedData.totalSales;
      totalSaleQuantity = selectedData.totalSaleQuantity;
      salesCount = selectedData.salesCount;

      totalPurchases = selectedData.totalPurchases;
      totalPurchaseQuantity = selectedData.totalPurchaseQuantity;
      purchasesCount = selectedData.purchasesCount;

      totalExpenses = selectedData.totalExpenses;
      expensesCount = selectedData.expensesCount;
    } else {
      for (const s of salesByWorker) {
        totalSales += s._sum.totalAmount || 0;
        totalSaleQuantity += s._sum.quantity || 0;
        salesCount += s._count.id || 0;
      }
      for (const p of purchasesByWorker) {
        totalPurchases += p._sum.totalAmount || 0;
        totalPurchaseQuantity += p._sum.quantity || 0;
        purchasesCount += p._count.id || 0;
      }
      for (const e of expensesByWorker) {
        totalExpenses += e._sum.amount || 0;
        expensesCount += e._count.id || 0;
      }
    }

    const profit = totalSales - totalPurchases - totalExpenses;

    const stats = {
      date: date || new Date().toISOString().split("T")[0],
      totalSales,
      totalSaleQuantity,
      salesCount,
      sales: new Array(salesCount),
      totalPurchases,
      totalPurchaseQuantity,
      purchasesCount,
      purchases: new Array(purchasesCount),
      totalExpenses,
      expensesCount,
      expenses: new Array(expensesCount),
      profit,
    };

    res.json({
      stats,
      shopStats,
    });
  } catch (error) {
    console.error("❌ Error in getDashboardOverview:", error);
    res.status(500).json({ error: error.message });
  }
};

// Generate Excel report
export const generateExcelReport = async (req, res) => {
  try {
    const userId = req.userId
    const { startDate, endDate } = req.query

    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (user.role !== "admin") {
      return res.status(403).json({ error: "Unauthorized" })
    }

    const start = new Date(startDate)
    const end = new Date(endDate)
    end.setHours(23, 59, 59, 999)

    const [sales, purchases, expenses, workerExpenses, saleBorrows, purchaseBorrows, funds] = await Promise.all([
      prisma.sale.findMany({
        where: { saleDate: { gte: start, lte: end } },
        include: { item: true, user: true },
      }),
      prisma.purchase.findMany({
        where: { purchaseDate: { gte: start, lte: end } },
        include: { item: true, user: true },
      }),
      prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
      }),
      prisma.workerExpense.findMany({
        where: { date: { gte: start, lte: end } },
        include: { worker: true },
      }),
      prisma.sale.findMany({
        where: { saleDate: { gte: start, lte: end }, paymentType: "borrow" },
        include: { item: true, user: true },
      }),
      prisma.purchase.findMany({
        where: { purchaseDate: { gte: start, lte: end }, paymentType: "borrow" },
        include: { item: true, user: true },
      }),
      prisma.workerFund.findMany({
        where: { createdAt: { gte: start, lte: end } },
        include: { owner: true },
      }),
    ])

    const workbook = new ExcelJS.Workbook()

    // 🧾 Sales Sheet
    const salesSheet = workbook.addWorksheet("Sales")
    salesSheet.columns = [
      { header: "Date", key: "saleDate", width: 12 },
      { header: "Item", key: "itemName", width: 20 },
      { header: "Shop ID", key: "shopId", width: 12 },
      { header: "Customer", key: "customerName", width: 20 },
      { header: "Phone", key: "customerPhone", width: 15 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Unit Price", key: "unitPrice", width: 12 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Payment Type", key: "paymentType", width: 15 },
      { header: "Borrow Amount", key: "borrowAmount", width: 15 },
    ]
    sales.forEach((s) => {
      salesSheet.addRow({
        saleDate: new Date(s.saleDate).toLocaleDateString(),
        itemName: s.item?.name || "-",
        shopId: s.user?.shopId || "-",
        customerName: s.customerName || "-",
        customerPhone: s.customerPhone || "-",
        quantity: s.quantity || 0,
        unitPrice: s.unitPrice || 0,
        totalAmount: s.totalAmount || 0,
        paymentType: s.paymentType || "paid",
        borrowAmount: s.borrowAmount || 0,
      })
    })

    // 🧾 Purchases Sheet
    const purchaseSheet = workbook.addWorksheet("Purchases")
    purchaseSheet.columns = [
      { header: "Date", key: "purchaseDate", width: 12 },
      { header: "Item", key: "itemName", width: 20 },
      { header: "Shop ID", key: "shopId", width: 12 },
      { header: "Supplier", key: "supplierName", width: 20 },
      { header: "Phone", key: "supplierPhone", width: 15 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Unit Price", key: "unitPrice", width: 12 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
      { header: "Payment Type", key: "paymentType", width: 15 },
      { header: "Borrow Amount", key: "borrowAmount", width: 15 },
    ]
    purchases.forEach((p) => {
      purchaseSheet.addRow({
        purchaseDate: new Date(p.purchaseDate).toLocaleDateString(),
        itemName: p.item?.name || "-",
        shopId: p.user?.shopId || "-",
        supplierName: p.supplierName || "-",
        supplierPhone: p.supplierPhone || "-",
        quantity: p.quantity || 0,
        unitPrice: p.unitPrice || 0,
        totalAmount: p.totalAmount || 0,
        paymentType: p.paymentType || "-",
        borrowAmount: p.borrowAmount || 0,
      })
    })

    // 🧾 Expenses Sheet
    const expenseSheet = workbook.addWorksheet("Expenses")
    expenseSheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Title", key: "title", width: 20 },
      { header: "Category", key: "category", width: 15 },
      { header: "Amount", key: "amount", width: 12 },
    ]
    expenses.forEach((e) => {
      expenseSheet.addRow({
        date: new Date(e.date).toLocaleDateString(),
        title: e.title || "-",
        category: e.category || "-",
        amount: e.amount || 0,
      })
    })

    // 🧾 Borrow Summary Sheet
    const borrowSheet = workbook.addWorksheet("Borrow Summary (Details)")
    borrowSheet.columns = [
      { header: "Type", key: "type", width: 15 },
      { header: "Date", key: "date", width: 12 },
      { header: "Item", key: "itemName", width: 20 },
      { header: "Name", key: "name", width: 25 },
      { header: "Contact", key: "contact", width: 20 },
      { header: "Shop ID", key: "shopId", width: 12 },
      { header: "Recorded By", key: "recordedBy", width: 18 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Borrow Amount", key: "borrowAmount", width: 15 },
      { header: "Total Amount", key: "totalAmount", width: 15 },
    ]

    const fundSheet = workbook.addWorksheet("Owner Funds")
    fundSheet.columns = [
      { header: "Date", key: "date", width: 15 },
      { header: "Owner Name", key: "ownerName", width: 20 },
      { header: "Given By", key: "givenBy", width: 20 },
      { header: "Amount (₹)", key: "givenAmount", width: 15 },
      { header: "Remaining (₹)", key: "remainingAmount", width: 15 },
    ]

    // Borrow Sales details
    saleBorrows.forEach((b) => {
      borrowSheet.addRow({
        type: "Sale Borrow",
        date: new Date(b.saleDate).toLocaleDateString(),
        itemName: b.item?.name || "-",
        name: b.customerName || "-",
        contact: b.customerPhone || "-",
        shopId: b.user?.shopId || "-",
        recordedBy: b.user?.name || "-",
        quantity: b.quantity || 0,
        borrowAmount: b.borrowAmount || 0,
        totalAmount: b.totalAmount || 0,
      })
    })

    // Borrow Purchases details
    purchaseBorrows.forEach((b) => {
      borrowSheet.addRow({
        type: "Purchase Borrow",
        date: new Date(b.purchaseDate).toLocaleDateString(),
        itemName: b.item?.name || "-",
        name: b.supplierName || "-",
        contact: b.supplierPhone || "-",
        shopId: b.user?.shopId || "-",
        recordedBy: b.user?.name || "-",
        quantity: b.quantity || 0,
        borrowAmount: b.borrowAmount || 0,
        totalAmount: b.totalAmount || 0,
      })
    })

    // 🧾 Funds
    funds.forEach((f) => {
      fundSheet.addRow({
        date: new Date(f.createdAt).toLocaleDateString(),
        ownerName: f.owner?.name || "-",
        givenBy: f.givenBy || "-",
        givenAmount: f.givenAmount || 0,
        remainingAmount: f.remainingAmount || 0,
      })
    })

    // 🧾 Worker Expenses Sheet
    const workerExpenseSheet = workbook.addWorksheet("Worker Expenses")
    workerExpenseSheet.columns = [
      { header: "Date", key: "date", width: 12 },
      { header: "Worker Name", key: "workerName", width: 20 },
      { header: "Title", key: "title", width: 20 },
      { header: "Amount (₹)", key: "amount", width: 15 },
    ]
    workerExpenses.forEach((we) => {
      workerExpenseSheet.addRow({
        date: new Date(we.date).toLocaleDateString(),
        workerName: we.worker?.name || "-",
        title: we.title || "-",
        amount: we.amount || 0,
      })
    })

    workerExpenseSheet.addRow({})
    workerExpenseSheet.addRow({
      workerName: "Total Worker Expenses",
      amount: workerExpenses.reduce((sum, e) => sum + e.amount, 0),
    })
    borrowSheet.addRow({})
    borrowSheet.addRow({
      type: "Total Borrow Sales",
      borrowAmount: saleBorrows.reduce((sum, b) => sum + (b.borrowAmount || 0), 0),
      totalAmount: saleBorrows.reduce((sum, b) => sum + b.totalAmount, 0),
    })
    borrowSheet.addRow({
      type: "Total Borrow Purchases",
      borrowAmount: purchaseBorrows.reduce((sum, b) => sum + (b.borrowAmount || 0), 0),
      totalAmount: purchaseBorrows.reduce((sum, b) => sum + b.totalAmount, 0),
    })

    fundSheet.addRow({})
    fundSheet.addRow({
      ownerName: "Total Funds Given",
      givenAmount: funds.reduce((sum, f) => sum + f.givenAmount, 0),
    })

    // ✅ Include in summary totals
    const totalSales = sales.reduce((sum, s) => sum + s.totalAmount, 0)
    const totalPurchases = purchases.reduce((sum, p) => sum + p.totalAmount, 0)
    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const totalWorkerExpenses = workerExpenses.reduce((sum, e) => sum + e.amount, 0)
    const grossProfit = totalSales - totalPurchases
    const netProfit = grossProfit - (totalExpenses + totalWorkerExpenses)

    const summarySheet = workbook.addWorksheet("Summary")
    summarySheet.columns = [
      { header: "Metric", key: "metric", width: 25 },
      { header: "Amount (₹)", key: "amount", width: 15 },
    ]
    summarySheet.addRows([
      { metric: "Total Sales", amount: totalSales },
      { metric: "Total Purchases", amount: totalPurchases },
      { metric: "Gross Profit", amount: grossProfit },
      { metric: "Regular Expenses", amount: totalExpenses },
      { metric: "Worker Expenses", amount: totalWorkerExpenses },
      { metric: "Net Profit", amount: netProfit },
    ])

    // ✅ Send Excel
    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    res.setHeader("Content-Disposition", `attachment; filename="report_${startDate}_to_${endDate}.xlsx"`)

    await workbook.xlsx.write(res)
    res.end()
  } catch (error) {
    console.error("Excel report error:", error)
    res.status(500).json({ error: error.message })
  }
}
