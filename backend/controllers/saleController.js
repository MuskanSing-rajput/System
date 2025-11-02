import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const createSale = async (req, res) => {
  try {
    const {
      itemId,
      customerName,
      customerContact,
      quantity,
      unitPrice,
      saleDate,
      image,
      paymentType,
      borrowAmount,
    } = req.body

    const item = await prisma.item.findUnique({ where: { id: itemId } })
    if (!item || item.stock < quantity) {
      return res.status(400).json({ error: "Insufficient stock" })
    }

    const qty = Number.parseFloat(quantity)
    const price = Number.parseFloat(unitPrice)
    const when = saleDate ? new Date(saleDate) : new Date()

    const sale = await prisma.sale.create({
      data: {
        itemId,
        customerName,
        customerContact,
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

    // ✅ Decrease stock after sale
    await prisma.item.update({
      where: { id: itemId },
      data: { stock: { decrement: qty } },
    })

    res.json(sale)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// export const getSales = async (req, res) => {
//   try {
//     const { startDate, endDate, shopId } = req.query
//     const user = await prisma.user.findUnique({ where: { id: req.userId } })

//     let where = {}

//     if (user.role === "admin") {
//       if (shopId && shopId !== "all") {
//         const users = await prisma.user.findMany({
//           where: { shopId, role: "worker" },
//           select: { id: true },
//         })
//         const userIds = users.map((u) => u.id)
//         if (userIds.length > 0) {
//           where.userId = { in: userIds }
//         } else {
//           return res.json([])
//         }
//       }
//     } else {
//       where.userId = req.userId
//     }

//     if (startDate && endDate) {
//       where.saleDate = {
//         gte: new Date(startDate),
//         lte: new Date(endDate),
//       }
//     }

//     const sales = await prisma.sale.findMany({
//       where,
//       include: { item: true, user: true },
//       orderBy: { saleDate: "desc" },
//     })
//     res.json(sales)
//   } catch (error) {
//     res.status(400).json({ error: error.message })
//   }
// }

export const getSales = async (req, res) => {
  try {
    const { startDate, endDate, shopId, page = 1, limit = 20 } = req.query;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    let where = {};

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

    if (startDate && endDate) {
      where.saleDate = { gte: new Date(startDate), lte: new Date(endDate) };
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
          item: { select: { name: true } },
          user: { select: { name: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { saleDate: "desc" },
      }),
      prisma.sale.count({ where }),
    ]);

    res.json({ data: sales, totalCount });
  } catch (error) {
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

    // ✅ Adjust stock (add back old qty, subtract new qty)
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
