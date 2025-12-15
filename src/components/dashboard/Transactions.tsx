'use client';

import { TransactionsFeed } from './TransactionsFeed';

export function Transactions() {
  return (
    <TransactionsFeed 
      maxPendingItems={3}
      maxCompletedItems={5}
      className="h-full overflow-hidden"
    />
  );
}