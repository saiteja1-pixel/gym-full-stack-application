const cron = require('node-cron');
const prisma = require('./prisma');

/**
 * Executes all daily automated check-in notifications, birthday alerts, and payment reminders.
 */
async function runDailyChecks() {
  console.log('[Cron] Starting daily checks for birthdays, expiries, and payment reminders...');
  const today = new Date();
  
  try {
    // 1. Membership Expiry Alerts
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    // Set hours to compare boundary conditions properly
    const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfSevenDays = new Date(sevenDaysLater.getFullYear(), sevenDaysLater.getMonth(), sevenDaysLater.getDate(), 23, 59, 59, 999);

    const expiringMembers = await prisma.member.findMany({
      where: {
        membership: {
          endDate: {
            gte: startOfToday,
            lte: endOfSevenDays
          },
          status: 'ACTIVE'
        }
      },
      include: {
        membership: true
      }
    });

    console.log(`[Cron] Found ${expiringMembers.length} members with expiring memberships.`);
    
    for (const member of expiringMembers) {
      const formattedDate = new Date(member.membership.endDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      // Avoid duplicate alert for the same day
      const existingAlert = await prisma.notification.findFirst({
        where: {
          recipientId: member.userId,
          title: 'Membership Expiring Soon',
          sentAt: {
            gte: startOfToday
          }
        }
      });

      if (!existingAlert) {
        await prisma.notification.create({
          data: {
            recipientId: member.userId,
            title: 'Membership Expiring Soon',
            message: `Your gym membership plan expires on ${formattedDate}. Contact reception to renew!`
          }
        });
      }
    }

    // 2. Birthday Alerts
    const allMembers = await prisma.member.findMany({
      select: {
        userId: true,
        name: true,
        dob: true
      }
    });

    const todayMonth = today.getMonth();
    const todayDate = today.getDate();

    const birthdayMembers = allMembers.filter(m => {
      if (!m.dob) return false;
      const dobDate = new Date(m.dob);
      return dobDate.getMonth() === todayMonth && dobDate.getDate() === todayDate;
    });

    console.log(`[Cron] Found ${birthdayMembers.length} members celebrating birthdays today.`);

    for (const member of birthdayMembers) {
      // Check if already notified today
      const existingAlert = await prisma.notification.findFirst({
        where: {
          recipientId: member.userId,
          title: 'Happy Birthday!',
          sentAt: {
            gte: startOfToday
          }
        }
      });

      if (!existingAlert) {
        await prisma.notification.create({
          data: {
            recipientId: member.userId,
            title: 'Happy Birthday!',
            message: `Happy Birthday from Core Fit Club! 🎂 Have a great workout today!`
          }
        });
      }
    }

    // 3. Payment Due Reminders (PENDING payment created > 3 days ago)
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - 3);

    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: threeDaysAgo
        }
      },
      include: {
        member: {
          select: {
            userId: true
          }
        }
      }
    });

    console.log(`[Cron] Found ${pendingPayments.length} pending invoices older than 3 days.`);

    for (const payment of pendingPayments) {
      if (!payment.member || !payment.member.userId) continue;

      // Check if already notified in last 3 days
      const existingAlert = await prisma.notification.findFirst({
        where: {
          recipientId: payment.member.userId,
          title: 'Payment Reminder',
          sentAt: {
            gte: threeDaysAgo
          }
        }
      });

      if (!existingAlert) {
        await prisma.notification.create({
          data: {
            recipientId: payment.member.userId,
            title: 'Payment Reminder',
            message: `Pending payment notice: invoice #${payment.invoiceNumber} is due.`
          }
        });
      }
    }

    console.log('[Cron] Daily checks completed successfully.');
  } catch (err) {
    console.error('[Cron] Error running daily checks:', err);
  }
}

/**
 * Initializes cron jobs.
 */
function initCronJobs() {
  // Schedule to run at 9:00 AM daily
  cron.schedule('0 9 * * *', () => {
    runDailyChecks();
  });
  console.log('[Cron] Daily jobs scheduled at 09:00 AM.');
}

module.exports = {
  initCronJobs,
  runDailyChecks
};
