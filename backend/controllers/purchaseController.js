import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const createPurchase = async (req, res) => {
  try {
    const {
      itemId,
      itemName,
      unit = "kg",
      supplierName,
      supplierContact,
      quantity,
      unitPrice,
      purchaseDate,
      image,
      paymentType,
      borrowAmount,
    } = req.body

    const userId = req.userId

    // find worker and shop
    const worker = await prisma.worker.findFirst({
      where: { userId },
      include: { user: true },
    })
    if (!worker) return res.status(404).json({ error: "Worker not found" })

    const shopId = worker.user.shopId
    if (!shopId) return res.status(400).json({ error: "Worker not linked to any shop" })

    // check or create item
    let resolvedItemId = itemId
    if (!resolvedItemId && itemName) {
      const existing = await prisma.item.findFirst({
        where: { userId, name: itemName },
      })
      resolvedItemId = existing
        ? existing.id
        : (await prisma.item.create({
            data: {
              userId,
              name: itemName,
              unit,
              category: "general",
              stock: 0,
            },
          })).id
    }

    const qty = parseFloat(quantity)
    const price = parseFloat(unitPrice)
    const totalAmount = qty * price

    // find fund by shopId
    const shopFund = await prisma.workerFund.findFirst({ where: { shopId } })
    if (!shopFund)
      return res.status(400).json({ error: "No fund available for this shop" })

    if (paymentType !== "borrow" && shopFund.remainingAmount < totalAmount)
      return res.status(400).json({
        error: `Insufficient funds. Available: ₹${shopFund.remainingAmount}, Required: ₹${totalAmount}`,
      })

    // create purchase
    const purchase = await prisma.purchase.create({
      data: {
        itemId: resolvedItemId,
        supplierName,
        supplierContact,
        quantity: qty,
        unitPrice: price,
        totalAmount,
        purchaseDate: new Date(purchaseDate || new Date()),
        image,
        paymentType,
        borrowAmount: paymentType === "borrow" ? borrowAmount : null,
        userId,
      },
    })

    // update stock
    await prisma.item.update({
      where: { id: resolvedItemId },
      data: { stock: { increment: qty } },
    })

    // deduct funds if not borrow
    if (paymentType !== "borrow") {
      await prisma.workerFund.update({
        where: { id: shopFund.id },
        data: { remainingAmount: { decrement: totalAmount } },
      })
    }

    res.json({ message: "Purchase successful", purchase })
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

// export const getPurchases = async (req, res) => {
//   try {
//     const { startDate, endDate, shopId } = req.query
//     const user = await prisma.user.findUnique({ where: { id: req.userId } })

//     let where = {}
    
//     // If admin, can see all purchases or filter by shop
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
//       // If shopId is "all" or not provided, admin sees all purchases
//     } else {
//       // For workers, only see their own purchases
//       where.userId = req.userId
//     }

//     // Add date filters if provided
//     if (startDate && endDate) {
//       where.purchaseDate = {
//         gte: new Date(startDate),
//         lte: new Date(endDate),
//       }
//     }

//     const purchases = await prisma.purchase.findMany({
//       where,
//       include: { item: true, user: true },
//       orderBy: { purchaseDate: "desc" },
//     })
//     res.json(purchases)
//   } catch (error) {
//     res.status(400).json({ error: error.message })
//   }
// }

export const getPurchases = async (req, res) => {
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
      where.purchaseDate = { gte: new Date(startDate), lte: new Date(endDate) };
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [purchases, totalCount] = await Promise.all([
      prisma.purchase.findMany({
        where,
        select: {
          id: true,
          purchaseDate: true,
          quantity: true,
          unitPrice: true,
          totalAmount: true,
          paymentType: true,
          borrowAmount: true,
          supplierName: true,
          item: { select: { name: true } },
          user: { select: { name: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.purchase.count({ where }),
    ]);

    res.json({ data: purchases, totalCount });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const updatePurchase = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      itemId,
      itemName,
      unit = "kg",
      supplierName,
      supplierContact,
      quantity,
      unitPrice,
      purchaseDate,
      image,
      paymentType,
      borrowAmount,
    } = req.body;

    // ✅ Validate that either itemId or itemName is provided
    let resolvedItemId = itemId;

    if (!resolvedItemId && itemName) {
      const existing = await prisma.item.findFirst({
        where: { userId: req.userId, name: itemName },
      });
      if (existing) {
        resolvedItemId = existing.id;
      } else {
        const created = await prisma.item.create({
          data: {
            userId: req.userId,
            name: itemName,
            unit,
            category: "general",
            stock: 0,
          },
        });
        resolvedItemId = created.id;
      }
    }

    if (!resolvedItemId) {
      return res.status(400).json({ error: "itemId or itemName is required" });
    }

    const qty = Number.parseFloat(quantity);
    const price = Number.parseFloat(unitPrice);
    const when = purchaseDate ? new Date(purchaseDate) : new Date();

    // ✅ Fetch old purchase to adjust stock difference
    const oldPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!oldPurchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // ✅ Update the purchase record
    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        itemId: resolvedItemId,
        supplierName,
        supplierContact,
        quantity: qty,
        unitPrice: price,
        totalAmount: qty * price,
        purchaseDate: when,
        image,
        paymentType,
        borrowAmount: paymentType === "borrow" ? borrowAmount : null,
      },
      include: { item: true },
    });

    // ✅ Adjust stock (subtract old qty, add new qty)
    const stockDiff = qty - oldPurchase.quantity;
    await prisma.item.update({
      where: { id: resolvedItemId },
      data: { stock: { increment: stockDiff } },
    });

    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

