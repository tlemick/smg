'use client';

import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WatchlistItemDetailed, WatchlistQuoteItem } from '@/types';
import { formatCurrency, formatPercentage, formatChange, getChangeColor } from '@/lib/formatters';

interface WatchlistTableProps {
  items: WatchlistItemDetailed[];
  quotes: WatchlistQuoteItem[];
  holdings: Record<string, number>;
}

export function WatchlistTable({ items, quotes, holdings }: WatchlistTableProps) {
  const router = useRouter();

  return (
    <div className="bg-card rounded-b-md overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[140px]">Ticker</TableHead>
            <TableHead className="text-left">Shares</TableHead>
            <TableHead className="text-left">Last Price</TableHead>
            <TableHead className="text-left">Open</TableHead>
            <TableHead className="text-left">Beta</TableHead>
            <TableHead className="text-left">Change</TableHead>
            <TableHead className="text-left">% Change</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const quote = quotes.find((q) => q.watchlistItemId === item.id);
            const quoteData = quote?.quote;
            const userShares = holdings[item.asset.ticker];

            return (
              <TableRow
                key={item.id}
                onClick={() => router.push(`/asset/${item.asset.ticker}`)}
                className="cursor-pointer"
              >
                <TableCell className="w-[140px]">
                  <div>
                    <div className="font-medium">{item.asset.ticker}</div>
                    <div className="text-xs text-muted-foreground truncate max-w-20">
                      {item.asset.name}
                    </div>
                  </div>
                </TableCell>
                <TableCell className="text-left">
                  {userShares ? userShares.toLocaleString() : '—'}
                </TableCell>
                <TableCell className="text-left font-medium">
                  {quoteData ? formatCurrency(quoteData.regularMarketPrice) : '—'}
                </TableCell>
                <TableCell className="text-left">
                  {quoteData?.regularMarketOpen
                    ? formatCurrency(quoteData.regularMarketOpen)
                    : '—'}
                </TableCell>
                <TableCell className="text-left">
                  {quoteData?.beta ? quoteData.beta.toFixed(2) : '—'}
                </TableCell>
                <TableCell
                  className={`text-left font-medium ${getChangeColor(
                    quoteData?.regularMarketChange || null
                  )}`}
                >
                  {quoteData?.regularMarketChange !== null &&
                  quoteData?.regularMarketChange !== undefined
                    ? formatChange(quoteData.regularMarketChange)
                    : '—'}
                </TableCell>
                <TableCell
                  className={`text-left font-medium ${getChangeColor(
                    quoteData?.regularMarketChangePercent || null
                  )}`}
                >
                  {quoteData?.regularMarketChangePercent !== null &&
                  quoteData?.regularMarketChangePercent !== undefined
                    ? formatPercentage(quoteData.regularMarketChangePercent, {
                        showSign: true,
                      })
                    : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
