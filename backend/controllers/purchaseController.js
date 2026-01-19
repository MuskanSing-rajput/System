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
      supplierPhone,
      quantity,
      unitPrice,
      purchaseDate,
      image,
      paymentType,
      borrowAmount,
    } = req.body;

    const userId = req.userId;

    // find worker and shop
    const worker = await prisma.worker.findFirst({
      where: { userId },
      include: { user: true },
    });

    if (!worker)
      return res.status(404).json({ error: "Worker not found" });

    const shopId = worker.user.shopId;
    if (!shopId)
      return res.status(400).json({ error: "Worker not linked to any shop" });

    // ✔ Check or create item
    let resolvedItemId = itemId;

    if (!resolvedItemId && itemName) {
      const existing = await prisma.item.findFirst({
        where: { userId, name: itemName },
      });

      resolvedItemId = existing
        ? existing.id
        : (
            await prisma.item.create({
              data: {
                userId,
                name: itemName,
                unit,
                category: "general",
                stock: 0,
              },
            })
          ).id;
    }

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const totalAmount = qty * price;

    // ✔ Get all funds for the shop
    const shopFunds = await prisma.workerFund.findMany({
      where: { shopId },
      orderBy: { createdAt: "desc" },
    });

    if (shopFunds.length === 0)
      return res.status(400).json({ error: "No fund available for this shop" });

    // ✔ Calculate total remaining balance
    const totalRemaining = shopFunds.reduce(
      (sum, f) => sum + (f.remainingAmount || 0),
      0
    );

    // ✔ Check insufficient funds
    if (paymentType !== "borrow" && totalRemaining < totalAmount) {
      return res.status(400).json({
        error: `Insufficient funds. Available: ₹${totalRemaining}, Required: ₹${totalAmount}`,
      });
    }

    // ✔ Deduct only from latest fund record
    const latestFund = shopFunds[0];

    if (paymentType !== "borrow") {
      await prisma.workerFund.update({
        where: { id: latestFund.id },
        data: { remainingAmount: { decrement: totalAmount } },
      });
    }

    // ✔ Create purchase (only include fields that are not null/undefined)
    const purchaseData = {
      itemId: resolvedItemId,
      quantity: qty,
      unitPrice: price,
      totalAmount,
      purchaseDate: new Date(purchaseDate || new Date()),
      userId,
    };

    if (supplierName !== undefined && supplierName !== null) purchaseData.supplierName = supplierName;
    if (supplierContact !== undefined && supplierContact !== null) purchaseData.supplierContact = supplierContact;
    if (supplierPhone !== undefined && supplierPhone !== null) purchaseData.supplierPhone = supplierPhone;
    if (image !== undefined && image !== null) purchaseData.image = image;
    if (paymentType !== undefined && paymentType !== null) purchaseData.paymentType = paymentType;
    if (paymentType === "borrow" && borrowAmount !== undefined && borrowAmount !== null) purchaseData.borrowAmount = borrowAmount;

    const purchase = await prisma.purchase.create({ data: purchaseData });

    // ✔ Update stock
    await prisma.item.update({
      where: { id: resolvedItemId },
      data: { stock: { increment: qty } },
    });

    res.json({
      message: "Purchase successful",
      purchase,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const getPurchases = async (req, res) => {
  try {
    const { startDate, endDate, shopId,paymentType, page = 1, limit = 500 } = req.query;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    let where = {};

    //  Admin logic
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

      // Apply date range filter if admin selected any date(s)
        if (startDate) {
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(startDate) || (endDate && !dateRegex.test(endDate))) {
            console.warn("Invalid date params in getPurchases - ignoring date filter", startDate, endDate);
          } else {
            const startUTC = new Date(`${startDate}T00:00:00+05:30`);
            const endUTC = endDate
              ? new Date(`${endDate}T23:59:59+05:30`)
              : new Date(`${startDate}T23:59:59+05:30`);

            where.purchaseDate = { gte: startUTC, lte: endUTC };
          }
        }
        if (paymentType && paymentType !== "all") {
          where.paymentType = paymentType
        }
    }
    //  Worker logic — always today's IST
    else {
      where.userId = req.userId;

      const nowIST = new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
      const year = nowIST.getFullYear();
      const month = String(nowIST.getMonth() + 1).padStart(2, "0");
      const day = String(nowIST.getDate()).padStart(2, "0");

      const startUTC = new Date(`${year}-${month}-${day}T00:00:00+05:30`);
      const endUTC = new Date(`${year}-${month}-${day}T23:59:59+05:30`);

      where.purchaseDate = { gte: startUTC, lte: endUTC };
    }

    // Pagination setup
    const skip = (Number(page) - 1) * Number(limit);

    //  Fetch filtered data
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
          supplierContact: true,
          item: { select: { name: true } },
          user: { select: { name: true } },
        },
        skip,
        take: Number(limit),
        orderBy: { purchaseDate: "desc" },
      }),
      prisma.purchase.count({ where }),
    ]);

    //  Convert UTC → IST
    const formattedPurchases = purchases.map((p) => ({
      ...p,
      purchaseDateIST: new Date(p.purchaseDate).toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: true,
      }),
    }));

    res.json({ data: formattedPurchases, totalCount });
  } catch (error) {
    console.error("❌ Error in getPurchases:", error);
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
      supplierPhone,
      quantity,
      unitPrice,
      purchaseDate,
      image,
      paymentType,
      borrowAmount,
    } = req.body;

    // Validate quantity & unitPrice
    if (!quantity || !unitPrice) {
      return res.status(400).json({ error: "Quantity and Unit Price are required" });
    }

    // Fetch old purchase
    const oldPurchase = await prisma.purchase.findUnique({
      where: { id },
      include: { item: true },
    });

    if (!oldPurchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    // Resolve itemId
    let resolvedItemId = itemId;
    if (!resolvedItemId && itemName) {
      const existing = await prisma.item.findFirst({
        where: { userId: req.userId, name: itemName },
      });

      if (existing) resolvedItemId = existing.id;
      else {
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

    const qty = parseFloat(quantity);
    const price = parseFloat(unitPrice);
    const totalAmount = qty * price;
    const dateUsed = purchaseDate ? new Date(purchaseDate) : new Date();

    // STOCK ADJUSTMENT
    // 1. Remove old quantity from old item
    await prisma.item.update({
      where: { id: oldPurchase.itemId },
      data: {
        stock: { decrement: oldPurchase.quantity },
      },
    });

    // 2. Add new quantity to (possibly new) item
    await prisma.item.update({
      where: { id: resolvedItemId },
      data: {
        stock: { increment: qty },
      },
    });

    // FINAL UPDATE (only include fields that are not null/undefined)
    const updateData = {
      itemId: resolvedItemId,
      quantity: qty,
      unitPrice: price,
      totalAmount,
      purchaseDate: dateUsed,
    };

    if (supplierName !== undefined && supplierName !== null) updateData.supplierName = supplierName;
    if (supplierContact !== undefined && supplierContact !== null) updateData.supplierContact = supplierContact;
    if (supplierPhone !== undefined && supplierPhone !== null) updateData.supplierPhone = supplierPhone;
    if (image !== undefined && image !== null) updateData.image = image;
    if (paymentType !== undefined && paymentType !== null) updateData.paymentType = paymentType;
    if (paymentType === "borrow" && borrowAmount !== undefined && borrowAmount !== null) updateData.borrowAmount = borrowAmount;

    const updated = await prisma.purchase.update({
      where: { id },
      data: updateData,
      include: {
        item: true,
        user: true,
      },
    });

    return res.json({
      message: "Purchase updated successfully",
      updated,
    });

  } catch (error) {
    console.error("❌ Error updating purchase:", error);
    return res.status(400).json({ error: error.message });
  }
};


export const payBorrowAmount = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount } = req.body; 

    // Find the purchase
    const purchase = await prisma.purchase.findUnique({
      where: { id },
    });

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    if (purchase.paymentType !== "borrow") {
      return res.status(400).json({ error: "This purchase is not a borrow" });
    }

    const user = await prisma.user.findUnique({
      where: { id: purchase.userId },
    });

    if (!user || !user.shopId) {
      return res.status(400).json({ error: "User not linked to any shop" });
    }

    // Find fund of that shop
    const shopFund = await prisma.workerFund.findFirst({
      where: { shopId: user.shopId },
    });

    if (!shopFund) {
      return res.status(400).json({ error: "No fund available for this shop" });
    }

    if (shopFund.remainingAmount < amount) {
      return res
        .status(400)
        .json({
          error: `Insufficient funds. Available ₹${shopFund.remainingAmount}`,
        });
    }

    // Deduct from fund
    await prisma.workerFund.update({
      where: { id: shopFund.id },
      data: {
        remainingAmount: { decrement: amount },
      },
    });

    // Reduce borrow amount by paid amount
    const newBorrowAmount = (purchase.borrowAmount || 0) - amount;
    
    // Update purchase: reduce borrow amount, mark paid only if fully paid
    const updated = await prisma.purchase.update({
      where: { id },
      data: {
        borrowAmount: Math.max(0, newBorrowAmount),
        paymentType: newBorrowAmount <= 0 ? "paid" : "borrow",
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

export const deletePurchase = async (req, res) => {
  try {
    const { id } = req.params;

    // Find the purchase with related item and user
    const purchase = await prisma.purchase.findUnique({
      where: { id },
      include: {
        item: true,
        user: true,
      },
    });

    if (!purchase) {
      return res.status(404).json({ error: "Purchase not found" });
    }

    const { itemId, quantity, totalAmount, paymentType, user } = purchase;

    // Get shop fund
    const shopFund = await prisma.workerFund.findFirst({
      where: { shopId: user.shopId },
    });

    // 1️⃣ Update stock (reduce purchased quantity)
    await prisma.item.update({
      where: { id: itemId },
      data: { stock: { decrement: quantity } },
    });

    // 2️⃣ If payment was not "borrow", refund the fund
    if (paymentType !== "borrow" && shopFund) {
      await prisma.workerFund.update({
        where: { id: shopFund.id },
        data: { remainingAmount: { increment: totalAmount } },
      });
    }

    // 3️⃣ Delete purchase
    await prisma.purchase.delete({ where: { id } });

    res.json({ message: "Purchase deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting purchase:", error);
    res.status(400).json({ error: error.message });
  }
};
