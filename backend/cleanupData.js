import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function cleanup() {
  console.log("🔍 Starting database inspection and cleanup...\n");

  try {
    // 1. Count existing records
    const initialPurchases = await prisma.purchase.count();
    const initialSales = await prisma.sale.count();
    const initialWorkerExpenses = await prisma.workerExpense.count();
    const initialWorkerFunds = await prisma.workerFund.count();
    const initialItems = await prisma.item.findMany();

    console.log(`Initial Counts:`);
    console.log(`- Purchases: ${initialPurchases}`);
    console.log(`- Sales: ${initialSales}`);
    console.log(`- Worker Expenses: ${initialWorkerExpenses}`);
    console.log(`- Worker Funds: ${initialWorkerFunds}`);
    console.log(`- Items: ${initialItems.length}\n`);

    // 2. Clear Purchases and Sales
    console.log("🗑️ Deleting all Purchase records...");
    const deletedPurchases = await prisma.purchase.deleteMany();
    console.log(`  Deleted ${deletedPurchases.count} Purchase records.`);

    console.log("🗑️ Deleting all Sale records...");
    const deletedSales = await prisma.sale.deleteMany();
    console.log(`  Deleted ${deletedSales.count} Sale records.`);

    // 3. Delete Worker Expenses
    console.log("🗑️ Deleting all WorkerExpense records...");
    const deletedWorkerExpenses = await prisma.workerExpense.deleteMany();
    console.log(`  Deleted ${deletedWorkerExpenses.count} WorkerExpense records.`);

    // 4. Delete Worker Funds
    console.log("🗑️ Deleting all WorkerFund records...");
    const deletedWorkerFunds = await prisma.workerFund.deleteMany();
    console.log(`  Deleted ${deletedWorkerFunds.count} WorkerFund records.`);

    // 5. Deduplicate Items and set stock to 0
    console.log("🧹 Deduplicating items and setting all item stocks to 0...");
    
    // Group items by name (case-insensitive & trimmed, or exact name)
    const itemsGroupedByName = {};
    for (const item of initialItems) {
      const key = item.name.trim().toLowerCase();
      if (!itemsGroupedByName[key]) {
        itemsGroupedByName[key] = [];
      }
      itemsGroupedByName[key].push(item);
    }

    const itemIdsToDelete = [];
    const itemIdsToKeep = [];

    for (const key in itemsGroupedByName) {
      const group = itemsGroupedByName[key];
      // Keep the first item in the group
      const keep = group[0];
      itemIdsToKeep.push(keep.id);

      // Mark remaining duplicate items for deletion
      for (let i = 1; i < group.length; i++) {
        itemIdsToDelete.push(group[i].id);
      }
    }

    console.log(`  Found ${initialItems.length} total items (${itemIdsToKeep.length} unique names, ${itemIdsToDelete.length} duplicates to remove).`);

    if (itemIdsToDelete.length > 0) {
      const deletedDuplicates = await prisma.item.deleteMany({
        where: {
          id: { in: itemIdsToDelete }
        }
      });
      console.log(`  Successfully deleted ${deletedDuplicates.count} duplicate item records.`);
    }

    // Set stock to 0 for all remaining items
    const updatedStocks = await prisma.item.updateMany({
      data: {
        stock: 0
      }
    });
    console.log(`  Updated stock to 0 for ${updatedStocks.count} remaining items.`);

    // Final Counts Summary
    console.log("\n✅ Cleanup Complete! Final Database Summary:");
    const finalPurchases = await prisma.purchase.count();
    const finalSales = await prisma.sale.count();
    const finalWorkerExpenses = await prisma.workerExpense.count();
    const finalWorkerFunds = await prisma.workerFund.count();
    const finalItems = await prisma.item.count();

    console.log(`- Remaining Items: ${finalItems} (All stocks set to 0, duplicates removed)`);
    console.log(`- Remaining Purchases: ${finalPurchases}`);
    console.log(`- Remaining Sales: ${finalSales}`);
    console.log(`- Remaining Worker Expenses: ${finalWorkerExpenses}`);
    console.log(`- Remaining Worker Funds: ${finalWorkerFunds}`);

  } catch (error) {
    console.error("❌ Cleanup error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();
