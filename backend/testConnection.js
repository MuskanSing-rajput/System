import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function test() {
  try {
    await prisma.$connect();
    console.log("✅ Connected successfully to Neon DB!");
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
