import bcrypt from 'bcryptjs';
import { prisma } from './db.js';

async function main() {
  console.log('🌱 Starting ExpenseAI database seed...');

  const email = 'tanmay.devop@gmail.com';
  const existing = await prisma.user.findUnique({ where: { email } });

  let user = existing;
  if (!user) {
    const passwordHash = await bcrypt.hash('ExpenseAI@2026', 10);
    user = await prisma.user.create({
      data: {
        name: 'Tanmay',
        email,
        passwordHash,
        currency: '₹',
      },
    });
    console.log(`Created user: ${user.name} (${user.email})`);
  } else {
    console.log(`Found existing user: ${user.name} (${user.email})`);
  }

  // Clear existing data for a fresh seed run
  await prisma.expense.deleteMany({ where: { userId: user.id } });
  await prisma.budget.deleteMany({ where: { userId: user.id } });
  await prisma.aIInsight.deleteMany({ where: { userId: user.id } });

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const monthStr = `${year}-${String(month + 1).padStart(2, '0')}`;

  // Seed Budgets
  const budgets = [
    { category: 'Total', amount: 35000 },
    { category: 'Food', amount: 8000 },
    { category: 'Shopping', amount: 5000 },
    { category: 'Transport', amount: 3000 },
    { category: 'Bills', amount: 6000 },
    { category: 'Entertainment', amount: 2500 },
    { category: 'Health', amount: 2000 },
  ];

  for (const b of budgets) {
    await prisma.budget.create({
      data: {
        userId: user.id,
        category: b.category,
        amount: b.amount,
        month: monthStr,
      },
    });
  }
  console.log(`Created ${budgets.length} budgets for month ${monthStr}`);

  // Seed Expenses for current month & previous days
  const sampleExpenses = [
    { title: "Domino's Pizza & Garlic Bread", amount: 649, category: 'Food', paymentMethod: 'UPI', daysAgo: 1, description: 'Weekend dinner with friends' },
    { title: 'Uber Ride to Tech Park', amount: 280, category: 'Transport', paymentMethod: 'UPI', daysAgo: 1, description: 'Morning commute' },
    { title: 'Netflix Premium Subscription', amount: 649, category: 'Subscription', paymentMethod: 'Card', daysAgo: 2, description: 'Monthly 4K streaming' },
    { title: 'Zepto Instant Grocery', amount: 840, category: 'Food', paymentMethod: 'UPI', daysAgo: 3, description: 'Milk, fruits, oats and pantry supplies' },
    { title: 'Amazon Electronics (Wireless Mouse)', amount: 1499, category: 'Shopping', paymentMethod: 'Card', daysAgo: 4, description: 'Ergonomic mouse for work desk' },
    { title: 'Airtel Fiber Broadband Bill', amount: 1179, category: 'Bills', paymentMethod: 'UPI', daysAgo: 5, description: '300 Mbps monthly fiber bill' },
    { title: 'Fuel at Indian Oil Station', amount: 1500, category: 'Transport', paymentMethod: 'Card', daysAgo: 6, description: 'Full tank petrol' },
    { title: 'Starbucks Hazelnut Latte & Croissant', amount: 480, category: 'Food', paymentMethod: 'UPI', daysAgo: 7, description: 'Client meeting coffee' },
    { title: 'Electricity Utility Bill (BESCOM)', amount: 2450, category: 'Bills', paymentMethod: 'Bank Transfer', daysAgo: 8, description: 'Monthly apartment electricity' },
    { title: 'Zara Summer Cotton Shirt', amount: 2590, category: 'Shopping', paymentMethod: 'Card', daysAgo: 10, description: 'Weekend shopping haul' },
    { title: 'PVR Inox Movie Tickets (IMAX)', amount: 950, category: 'Entertainment', paymentMethod: 'UPI', daysAgo: 12, description: '2 tickets for evening show' },
    { title: 'Apollo Pharmacy Medicines', amount: 620, category: 'Health', paymentMethod: 'Cash', daysAgo: 14, description: 'Vitamins and routine prescriptions' },
    { title: 'Swiggy Gourmet Lunch', amount: 530, category: 'Food', paymentMethod: 'UPI', daysAgo: 15, description: 'Team lunch delivery' },
    { title: 'Spotify Premium Individual', amount: 119, category: 'Subscription', paymentMethod: 'UPI', daysAgo: 18, description: 'Music streaming' },
    { title: 'Cult.fit Gym Membership Monthly', amount: 1800, category: 'Health', paymentMethod: 'Card', daysAgo: 20, description: 'Gym and fitness center access' },
  ];

  for (const exp of sampleExpenses) {
    const expenseDate = new Date();
    expenseDate.setDate(now.getDate() - exp.daysAgo);

    await prisma.expense.create({
      data: {
        userId: user.id,
        title: exp.title,
        amount: exp.amount,
        category: exp.category,
        paymentMethod: exp.paymentMethod,
        date: expenseDate,
        description: exp.description,
      },
    });
  }
  console.log(`Created ${sampleExpenses.length} verified transactions.`);
  console.log('✅ Seed complete! You can now log in with:');
  console.log(`   Email: ${email}`);
  console.log('   Password: ExpenseAI@2026');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
