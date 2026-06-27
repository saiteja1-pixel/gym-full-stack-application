const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const trainer = await prisma.trainer.findFirst({
    where: { user: { email: 'trainer@corefit.com' } }
  });

  if (!trainer) {
    console.log("No trainer found");
    return;
  }

  // Find the first member in the database
  const member = await prisma.member.findFirst();
  if (member) {
    await prisma.member.update({
      where: { id: member.id },
      data: { trainerId: trainer.id }
    });
    console.log(`✅ Assigned member ${member.name} (ID: ${member.memberId}) to trainer ${trainer.name}`);
  } else {
    console.log("ℹ️ No members found in database yet. Register a member first via Admin dashboard.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
