import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUserHoldings() {
  try {
    console.log('Querying database for user: user@smg.com');
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: 'user@smg.com'
      },
      include: {
        portfolios: {
          include: {
            holdings: {
              include: {
                asset: {
                  include: {
                    stock: true,
                    bond: true,
                    mutualFund: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user) {
      console.log('❌ User not found');
      return;
    }

    console.log(`✅ User found: ${user.name || 'No name'} (${user.email})`);
    console.log(`   - ID: ${user.id}`);
    console.log(`   - Role: ${user.role}`);
    console.log(`   - Active: ${user.active}`);
    console.log(`   - Created: ${user.createdAt}`);

    if (user.portfolios.length === 0) {
      console.log('❌ No portfolios found for this user');
      return;
    }

    console.log(`\n📊 Found ${user.portfolios.length} portfolio(s):`);
    
    for (const portfolio of user.portfolios) {
      console.log(`\n  Portfolio: ${portfolio.name || 'Unnamed'}`);
      console.log(`  - ID: ${portfolio.id}`);
      console.log(`  - Cash Balance: $${portfolio.cash_balance.toFixed(2)}`);
      console.log(`  - Created: ${portfolio.createdAt}`);
      console.log(`  - Holdings: ${portfolio.holdings.length} positions`);

      if (portfolio.holdings.length === 0) {
        console.log('    ❌ No holdings in this portfolio');
      } else {
        console.log('\n    📈 Current Holdings:');
        
        let totalValue = 0;
        for (const holding of portfolio.holdings) {
          const asset = holding.asset;
          const value = holding.quantity * holding.averagePrice;
          totalValue += value;
          
          console.log(`    - ${asset.ticker} (${asset.name})`);
          console.log(`      * Type: ${asset.type}`);
          console.log(`      * Quantity: ${holding.quantity}`);
          console.log(`      * Average Price: $${holding.averagePrice.toFixed(2)}`);
          console.log(`      * Current Value: $${value.toFixed(2)}`);
          console.log(`      * Last Updated: ${holding.updatedAt}`);
          
          if (asset.stock) {
            console.log(`      * Sector: ${asset.stock.sector || 'N/A'}`);
            console.log(`      * Industry: ${asset.stock.industry || 'N/A'}`);
          }
          
          if (asset.bond) {
            console.log(`      * Issuer: ${asset.bond.issuer || 'N/A'}`);
            console.log(`      * Maturity: ${asset.bond.maturityDate || 'N/A'}`);
          }
          
          if (asset.mutualFund) {
            console.log(`      * Fund Family: ${asset.mutualFund.fundFamily || 'N/A'}`);
            console.log(`      * Fund Type: ${asset.mutualFund.fundType || 'N/A'}`);
          }
          
          console.log('');
        }
        
        console.log(`    📊 Total Holdings Value: $${totalValue.toFixed(2)}`);
        console.log(`    💰 Total Portfolio Value: $${(totalValue + portfolio.cash_balance).toFixed(2)}`);
      }
    }

    // Also check for any recent transactions
    console.log('\n📋 Recent Transactions (last 10):');
    const recentTransactions = await prisma.transaction.findMany({
      where: {
        userId: user.id
      },
      include: {
        asset: true
      },
      orderBy: {
        date: 'desc'
      },
      take: 10
    });

    if (recentTransactions.length === 0) {
      console.log('   ❌ No transactions found');
    } else {
      for (const transaction of recentTransactions) {
        console.log(`   - ${transaction.type} ${transaction.quantity} shares of ${transaction.asset.ticker} at $${transaction.price.toFixed(2)} (Total: $${transaction.total.toFixed(2)}) on ${transaction.date}`);
      }
    }

    // Check for any pending limit orders
    console.log('\n📋 Pending Limit Orders:');
    const pendingOrders = await prisma.limitOrder.findMany({
      where: {
        userId: user.id,
        status: 'PENDING'
      },
      include: {
        asset: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (pendingOrders.length === 0) {
      console.log('   ❌ No pending limit orders');
    } else {
      for (const order of pendingOrders) {
        console.log(`   - ${order.type} ${order.quantity} shares of ${order.asset.ticker} at $${order.limitPrice.toFixed(2)} (Created: ${order.createdAt})`);
      }
    }

  } catch (error) {
    console.error('❌ Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
checkUserHoldings().catch(console.error); 