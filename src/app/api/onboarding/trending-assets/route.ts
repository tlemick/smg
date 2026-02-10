import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/prisma/client';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const assetType = searchParams.get('type') || 'STOCK';
    const limit = parseInt(searchParams.get('limit') || '5');

    // Get trending assets based on recent transaction volume
    const trendingAssets = await prisma.asset.findMany({
      where: {
        type: assetType.toUpperCase(),
        active: true,
      },
      include: {
        transactions: {
          where: {
            date: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
          },
          select: {
            id: true,
          },
        },
        quoteCache: true,
      },
      take: 50, // Get more initially to filter and sort
    });

    // Calculate trending score and format response
    const assetsWithScore = trendingAssets
      .map((asset) => {
        const recentTransactions = asset.transactions.length;
        const currentPrice = asset.quoteCache?.regularMarketPrice || 0;
        const priceChange = asset.quoteCache?.regularMarketChange || 0;
        const priceChangePercent = asset.quoteCache?.regularMarketChangePercent || 0;

        return {
          id: asset.id,
          ticker: asset.ticker,
          name: asset.name,
          type: asset.type,
          currentPrice,
          priceChange,
          priceChangePercent,
          recentTransactions,
          logoUrl: asset.logoUrl,
          trendingScore: recentTransactions, // Could be more complex formula
        };
      })
      .filter((asset) => asset.currentPrice > 0) // Only assets with valid prices
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      assets: assetsWithScore.map(({ trendingScore, ...asset }) => asset),
      assetType,
    });
  } catch (error) {
    console.error('Error fetching trending assets:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch trending assets',
      },
      { status: 500 }
    );
  }
}

