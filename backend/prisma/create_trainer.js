const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const trainerEmail = 'trainer@corefit.com';

  const existingTrainer = await prisma.user.findUnique({
    where: { email: trainerEmail }
  });

  if (!existingTrainer) {
    const passwordHash = await bcrypt.hash('CoreFit2026!', 10);
    await prisma.user.create({
      data: {
        email: trainerEmail,
        passwordHash,
        role: 'TRAINER',
        trainerProfile: {
          create: {
            name: 'Alex Mercer',
            phone: '9876543211',
            specialty: 'Bodybuilding & Hypertrophy',
            bio: 'Certified strength and conditioning specialist with 8+ years of coaching experience.'
          }
        }
      }
    });
    console.log(`✅ Trainer created successfully: ${trainerEmail} (password: CoreFit2026!)`);
  } else {
    console.log(`ℹ️ Trainer ${trainerEmail} already exists.`);
  }
}

main()
  .catch((e) => {
    console.error('❌ Error creating trainer:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
