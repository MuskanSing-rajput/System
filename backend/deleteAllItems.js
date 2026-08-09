import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function deleteAllItems() {
  console.log("🗑️ Deleting all records from Item table...");

  try {
    const countBefore = await prisma.item.count();
    console.log(`Initial Item count: ${countBefore}`);

    const deleted = await prisma.item.deleteMany();
    console.log(`Successfully deleted ${deleted.count} item records.`);

    const countAfter = await prisma.item.count();
    console.log(`Final Item count: ${countAfter}`);
  } catch (error) {
    console.error("❌ Error deleting items:", error);
  } finally {
    await prisma.$disconnect();
  }
}

deleteAllItems();
