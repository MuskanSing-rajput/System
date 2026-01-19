import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const createItem = async (req, res) => {
  try {
    const { name, description, category, unit, minStock, image, stock } = req.body
    const parsedMinStock = parseFloat(minStock) || 0
    const parsedStock = parseFloat(stock) || 0

    // check if item with same name exists for this user
    const existing = await prisma.item.findFirst({ where: { userId: req.userId, name } })

    if (existing) {
      // update existing item's stock by adding provided stock, and update other fields
      const updated = await prisma.item.update({
        where: { id: existing.id },
        data: {
          description,
          category,
          unit,
          minStock: parsedMinStock,
          image,
          stock: (existing.stock || 0) + parsedStock,
        },
      })
      return res.json(updated)
    }

    const item = await prisma.item.create({
      data: {
        name,
        description,
        category,
        unit,
        minStock: parsedMinStock,
        image,
        stock: parsedStock,
        userId: req.userId,
      },
    })
    res.json(item)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const getItems = async (req, res) => {
  try {
    const { shopId } = req.query;
    const user = await prisma.user.findUnique({ where: { id: req.userId } });

    // Admin: can request items for a shop or all shops
    if (user && user.role === "admin") {
      // if shopId provided and not 'all', find users for that shop
      if (shopId && shopId !== "all") {
        const shopUsers = await prisma.user.findMany({ where: { shopId, role: "worker" }, select: { id: true } });
        const userIds = shopUsers.map(u => u.id);
        const items = await prisma.item.findMany({ where: { userId: { in: userIds } }, include: { user: true } });
        return res.json(items);
      }

      // admin without shop filter -> return all items with associated user
      const items = await prisma.item.findMany({ include: { user: true } });
      return res.json(items);
    }

    // Worker logic — only their own items
    const items = await prisma.item.findMany({ where: { userId: req.userId }, include: { purchases: true, sales: true } });
    res.json(items)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const getItemById = async (req, res) => {
  try {
    const item = await prisma.item.findFirst({
      where: { id: req.params.id, userId: req.userId },
      include: { purchases: true, sales: true },
    })
    if (!item) return res.status(404).json({ error: "Item not found" })
    res.json(item)
  } catch (error) {
    res.status(400).json({ error: error.message })
  }
}

export const updateItem = async (req, res) => {
  try {
    const { name, description, category, unit, minStock, image } = req.body;

    const item = await prisma.item.updateMany({
      where: { id: req.params.id, userId: req.userId },
      data: {
        name,
        description,
        category,
        unit,
        minStock: parseFloat(minStock) || 0, 
        image,
      },
    });

    res.json(item);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const getItemNamesAndStock = async (req, res) => {
  try {
    const items = await prisma.item.findMany({
      select: {
        id: true,
        name: true,
        stock: true,
        unit:true,
      },
    })
    const uniqueItems = Array.from(new Map(items.map(i => [i.name, i])).values())

    res.json(uniqueItems)
  } catch (error) {
    console.error("Error fetching item names and stock:", error)
    res.status(500).json({ error: "Failed to fetch item names and stock" })
  }
}