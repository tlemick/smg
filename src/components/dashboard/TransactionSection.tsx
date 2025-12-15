'use client';

import { TransactionSectionProps } from '@/types';
import { TransactionItem } from './TransactionItem';
import { CheckCircleIcon, HourglassHighIcon, Icon } from '@/components/ui';

// Icon components for section headers
const SectionIcon = ({ icon }: { icon: 'pending' | 'completed' }) => {
  if (icon === 'pending') {
    return <Icon icon={HourglassHighIcon} size="sm" weight="bold" />;
  } else {
    return <Icon icon={CheckCircleIcon} size="sm" />;
  }
};

export function TransactionSection({ 
  title, 
  icon, 
  badgeColor, 
  orders, 
  maxItems, 
  emptyMessage, 
  loading = false 
}: TransactionSectionProps) {
  
  const displayOrders = maxItems ? orders.slice(0, maxItems) : orders;
  const hasMoreItems = maxItems && orders.length > maxItems;
  const remainingCount = hasMoreItems ? orders.length - maxItems : 0;

  const getBadgeClasses = () => {
    return badgeColor === 'yellow' 
      ? 'bg-[#FEF100] border-none text-gray-900 dark:text-gray-900'
      : 'bg-gray-200 dark:bg-gray-700 border-none text-gray-900 dark:text-gray-100';
  };

  return (
    <div className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center space-x-2">
        <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getBadgeClasses()}`}>
          <SectionIcon icon={icon} />
          <span className="ml-2">{title}</span>
        </span>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-6">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-400 dark:border-gray-500"></div>
          <span className="ml-2 text-sm text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-6">
          <div className="text-gray-400 dark:text-gray-500 mb-2">
            <SectionIcon icon={icon} />
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400">{emptyMessage}</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length > 0 && (
        <div className="space-y-2">
          {displayOrders.map((order) => (
            <TransactionItem
              key={order.id}
              order={order}
              showTimestamp={true}
              compact={true}
            />
          ))}
          
          {/* Show remaining count if there are more items */}
          {hasMoreItems && (
            <div className="text-center py-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">
                and {remainingCount} more {title.toLowerCase()}...
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}