import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export const createItem = async (req, res) => {
  try {
    const { name, description, category, unit, minStock, image } = req.body
    const item = await prisma.item.create({
      data: {
        name,
        description,
        category,
        unit,
        minStock: parseFloat(minStock) || 0, 
        image,
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
    const items = await prisma.item.findMany({
      where: { userId: req.userId },
      include: { purchases: true, sales: true },
    })
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