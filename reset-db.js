const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  await prisma.setting.deleteMany();
  console.log('Deleted settings successfully');
}

run()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
