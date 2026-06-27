const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // 1. Create Default Admin User
  const adminEmail = 'admin@corefit.com';
  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail }
  });

  if (!existingAdmin) {
    const passwordHash = await bcrypt.hash('CoreFit2026!', 10);
    await prisma.user.create({
      data: {
        email: adminEmail,
        passwordHash,
        role: 'ADMIN',
        adminProfile: {
          create: {
            name: 'System Administrator',
            phone: '9876543210',
            gymName: 'Core Fit Club'
          }
        }
      }
    });
    console.log(`✅ Default admin created: ${adminEmail} (password: CoreFit2026!)`);
  } else {
    console.log(`ℹ️ Admin user ${adminEmail} already exists, skipping creation.`);
  }

  // 2. Create Default Membership Plans
  const plans = [
    {
      name: 'Monthly Premium',
      price: 1999,
      duration: 'MONTHLY',
      durationDays: 30,
      joiningFee: 500,
      gstPercent: 18.0,
      freezeDays: 5,
      description: 'Standard monthly membership with 5 freeze days.'
    },
    {
      name: 'Quarterly Elite',
      price: 4999,
      duration: 'QUARTERLY',
      durationDays: 90,
      joiningFee: 500,
      gstPercent: 18.0,
      freezeDays: 15,
      description: 'Quarterly saver membership with 15 freeze days.'
    },
    {
      name: 'Annual Legend',
      price: 15999,
      duration: 'ANNUAL',
      durationDays: 365,
      joiningFee: 0,
      gstPercent: 18.0,
      freezeDays: 45,
      description: 'Top tier annual membership with zero joining fee and 45 freeze days.'
    }
  ];

  for (const plan of plans) {
    const existingPlan = await prisma.membershipPlan.findUnique({
      where: { name: plan.name }
    });

    if (!existingPlan) {
      await prisma.membershipPlan.create({ data: plan });
      console.log(`✅ Created membership plan: ${plan.name}`);
    } else {
      console.log(`ℹ️ Plan ${plan.name} already exists, skipping.`);
    }
  }

  console.log('🌿 Database seed complete!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
