import { PrismaClient } from "@prisma/client"
const prisma = new PrismaClient()

export const createSale = async (req, res) => {
  try {
    const {
      itemId,
      customerName,
      customerContact,
      customerPhone,
      quantity,
      unitPrice,
      saleDate,
      image,
      paymentType,
      borrowAmount,
    } = req.body

    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item) {
      return res.status(400).json({ error: "Item not found" })
    }
    
    const qty = Number.parseFloat(quantity)
    
    if (item.stock < qty) {
      return res.status(400).json({ error: `Insufficient stock. Available: ${item.stock}, Requested: ${qty}` })
    }

    const price = Number.parseFloat(unitPrice)
    const when = saleDate ? new Date(saleDate) : new Date()

    const sale = await prisma.sale.create({
      data: {
        itemId,
        customerName,
        customerContact,
        customerPhone,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        saleDate: when,
        image,
        paymentType,
        borrowAmount: paymentType === "borrow" ? borrowAmount : null,
        userId: req.userId,
      },
    })

    //  Decrease stock after sale
    await prisma.item.update({
      where: { id: itemId },
      data: { stock: { decrement: qty } },
    })

    res.json(sale)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, shopId, paymentType, page = 1, limit = 100 } = req.query;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    let where = {};

    // 🧠 Role-based filtering
    if (user.role === "admin") {
      if (shopId && shopId !== "all") {
        const users = await prisma.user.findMany({
          where: { shopId, role: "worker" },
          select: { id: true },
        });
        const userIds = users.map((u) => u.id);
        if (userIds.length > 0) where.userId = { in: userIds };
        else return res.json({ data: [], totalCount: 0 });
      }
    } else {
      where.userId = req.userId;
    }

    //  Date filter logic
    let startUTC, endUTC;

    try {
      if (startDate && endDate) {
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
          throw new Error("Invalid date format. Expected YYYY-MM-DD");
        }
        // If frontend provides range, respect that (IST → UTC)
        startUTC = new Date(`${startDate}T00:00:00+05:30`);
        endUTC = new Date(`${endDate}T23:59:59+05:30`);
      } else {
      // Otherwise, default to today’s IST range
      const now = new Date();
      const todayIST = new Date(
        now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
      );
      const startOfDayIST = new Date(todayIST);
      startOfDayIST.setHours(0, 0, 0, 0);
      const endOfDayIST = new Date(todayIST);
      endOfDayIST.setHours(23, 59, 59, 999);

      startUTC = new Date(startOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);
      endUTC = new Date(endOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);
    }

    where.saleDate = { gte: startUTC, lte: endUTC };

    // Apply paymentType filter when provided
    if (paymentType && paymentType !== "all") {
      where.paymentType = paymentType;
    }
    } catch (err) {
      console.warn("Invalid date params in getSales, falling back to default range:", err.message);
      // Fallback to today's IST range
      const now = new Date();
      const todayIST = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const startOfDayIST = new Date(todayIST);
      startOfDayIST.setHours(0, 0, 0, 0);
      const endOfDayIST = new Date(todayIST);
      endOfDayIST.setHours(23, 59, 59, 999);

      startUTC = new Date(startOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);
      endUTC = new Date(endOfDayIST.getTime() - 5.5 * 60 * 60 * 1000);
      where.saleDate = { gte: startUTC, lte: endUTC };
      if (paymentType && paymentType !== "all") {
        where.paymentType = paymentType;
      }
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [sales, totalCount] = await Promise.all([
      prisma.sale.findMany({
        where,
        select: {
          id: true,
          saleDate: true,
          quantity: true,
          unitPrice: true,
          totalAmount: true,
          paymentType: true,
          borrowAmount: true,
          customerName: true,
          customerContact: true,
          item: { select: { name: true } },
          user: { select: { name: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { saleDate: "desc" },
      }),
      prisma.sale.count({ where }),
    ]);

    // Convert UTC → IST
    const formattedSales = sales.map((s) => ({
      ...s,
      saleDateIST: new Date(s.saleDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      }),
    }));

    res.json({ data: formattedSales, totalCount });
  } catch (error) {
    console.error("❌ Error in getSales:", error);
    res.status(400).json({ error: error.message });
  }
};

export const updateSale = async (req, res) => {
  try {
    const { id } = req.params
    const {
      itemId,
      customerName,
      customerContact,
      customerPhone,
      quantity,
      unitPrice,
      saleDate,
      image,
      paymentType,
      borrowAmount,
    } = req.body

    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { item: true },
    })

    if (!sale) {
      return res.status(404).json({ error: "Sale not found" })
    }

    const qty = Number.parseFloat(quantity)
    const price = Number.parseFloat(unitPrice)
    const when = saleDate ? new Date(saleDate) : new Date()

    // Adjust stock (add back old qty, subtract new qty)
    const stockDiff = sale.quantity - qty
    await prisma.item.update({
      where: { id: itemId || sale.itemId },
      data: { stock: { increment: stockDiff } },
    })

    const updated = await prisma.sale.update({
      where: { id },
      data: {
        itemId: itemId || sale.itemId,
        customerName,
        customerContact,
        customerPhone,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        saleDate: when,
        image,
        paymentType,
        borrowAmount: paymentType === "borrow" ? borrowAmount : null,
      },
      include: { item: true },
    })

    res.json(updated)
  } catch (err) {
    res.status(400).json({ error: err.message })
  }
}

export const payBorrowSale = async (req, res) => {
  try {
    const { id } = req.params; // sale ID
    const { amount } = req.body; // amount paid by customer

    // Find the sale
    const sale = await prisma.sale.findUnique({
      where: { id },
    });

    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    if (sale.paymentType !== "borrow") {
      return res.status(400).json({ error: "This sale is not a borrow" });
    }

    // Reduce borrow amount by paid amount
    const newBorrowAmount = (sale.borrowAmount || 0) - amount;

    // Update the sale record: reduce borrow, mark paid only if fully paid
    const updated = await prisma.sale.update({
      where: { id },
      data: {
        paymentType: newBorrowAmount <= 0 ? "paid" : "borrow",
        borrowAmount: Math.max(0, newBorrowAmount),
      },
    });

    res.json({ 
      message: newBorrowAmount <= 0 ? "Fully paid" : "Partial payment recorded", 
      updated,
      remainingBorrow: Math.max(0, newBorrowAmount)
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const deleteSale = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the sale with related item
    const sale = await prisma.sale.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!sale) {
      return res.status(404).json({ error: "Sale not found" });
    }

    const { itemId, quantity } = sale;

    // 1️ Add sold quantity back to stock
    await prisma.item.update({
      where: { id: itemId },
      data: { stock: { increment: quantity } },
    });

    // 2️Delete sale
    await prisma.sale.delete({ where: { id } });

    res.json({ message: "Sale deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting sale:", error);
    res.status(400).json({ error: error.message });
  }
};
