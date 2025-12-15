/**
 * Service for fetching company logos from multiple sources
 */

export async function getCompanyLogoUrl(ticker: string, companyName?: string): Promise<string | null> {
  const cleanTicker = ticker.toUpperCase();
  
  // Map of known tickers to reliable logo URLs
  const logoMap: Record<string, string> = {
    'AAPL': 'https://logo.clearbit.com/apple.com',
    'GOOGL': 'https://logo.clearbit.com/google.com',
    'GOOG': 'https://logo.clearbit.com/google.com', 
    'MSFT': 'https://logo.clearbit.com/microsoft.com',
    'AMZN': 'https://logo.clearbit.com/amazon.com',
    'TSLA': 'https://logo.clearbit.com/tesla.com',
    'META': 'https://logo.clearbit.com/meta.com',
    'NVDA': 'https://logo.clearbit.com/nvidia.com',
    'NFLX': 'https://logo.clearbit.com/netflix.com',
    'DIS': 'https://logo.clearbit.com/disney.com',
    'V': 'https://logo.clearbit.com/visa.com',
    'JPM': 'https://logo.clearbit.com/jpmorganchase.com',
    'WMT': 'https://logo.clearbit.com/walmart.com',
    'PG': 'https://logo.clearbit.com/pg.com',
    'HD': 'https://logo.clearbit.com/homedepot.com',
    'BAC': 'https://logo.clearbit.com/bankofamerica.com',
    'MA': 'https://logo.clearbit.com/mastercard.com',
    'XOM': 'https://logo.clearbit.com/exxonmobil.com',
    'JNJ': 'https://logo.clearbit.com/jnj.com',
    'CVX': 'https://logo.clearbit.com/chevron.com'
  };

  // Try direct mapping first
  if (logoMap[cleanTicker]) {
    return logoMap[cleanTicker];
  }

  // Try ClearBit with ticker domain
  const clearbitUrl = `https://logo.clearbit.com/${cleanTicker.toLowerCase()}.com`;
  
  // Test if the logo exists (optional - for production you might skip this check)
  try {
    const response = await fetch(clearbitUrl, { method: 'HEAD' });
    if (response.ok) {
      return clearbitUrl;
    }
  } catch (error) {
    // Silently continue to other options
  }

  // Fallback to null (will show letter initials)
  return null;
}

export async function testLogoUrl(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
}