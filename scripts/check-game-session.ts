import { prisma } from '@/prisma/client';

async function checkGameSession() {
  console.log('Checking active game sessions...\n');
  
  const sessions = await prisma.gameSession.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      startingCash: true,
      isActive: true,
      startDate: true,
      endDate: true,
      _count: {
        select: {
          portfolios: true
        }
      }
    }
  });

  console.log(`Found ${sessions.length} active sessions:\n`);
  sessions.forEach(session => {
    console.log(`Session: ${session.name || session.id}`);
    console.log(`  Starting Cash: $${session.startingCash.toLocaleString()}`);
    console.log(`  Start Date: ${session.startDate.toISOString()}`);
    console.log(`  End Date: ${session.endDate.toISOString()}`);
    console.log(`  Portfolios: ${session._count.portfolios}`);
    console.log(`  Active: ${session.isActive}`);
    console.log('');
  });

  // Check a sample portfolio
  if (sessions.length > 0) {
    console.log('Checking sample portfolio from first session...\n');
    const portfolio = await prisma.portfolio.findFirst({
      where: { sessionId: sessions[0].id },
      include: {
        user: { select: { name: true, email: true } },
        holdings: {
          include: {
            asset: { select: { ticker: true, name: true } }
          }
        }
      }
    });

    if (portfolio) {
      console.log(`User: ${portfolio.user.name || portfolio.user.email}`);
      console.log(`Cash Balance: $${portfolio.cash_balance.toLocaleString()}`);
      console.log(`Holdings: ${portfolio.holdings.length}`);
      
      let holdingsValue = 0;
      for (const holding of portfolio.holdings) {
        const quote = await prisma.assetQuoteCache.findUnique({
          where: { assetId: holding.assetId }
        });
        const price = quote?.regularMarketPrice || 0;
        const value = Number(holding.quantity) * Number(price);
        holdingsValue += value;
        console.log(`  ${holding.asset.ticker}: ${holding.quantity} shares @ $${price} = $${value.toFixed(2)}`);
      }
      
      const totalValue = Number(portfolio.cash_balance) + holdingsValue;
      const startingCash = Number(sessions[0].startingCash);
      const returnPercent = ((totalValue / startingCash) - 1) * 100;
      
      console.log(`\nTotal Portfolio Value: $${totalValue.toLocaleString()}`);
      console.log(`Starting Cash: $${startingCash.toLocaleString()}`);
      console.log(`Return: ${returnPercent.toFixed(2)}%`);
    }
  }

  await prisma.$disconnect();
}

checkGameSession().catch(console.error);
