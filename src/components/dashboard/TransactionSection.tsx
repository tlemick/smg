'use client';

import { TransactionSectionProps } from '@/types';
import { TransactionItem } from './TransactionItem';
import { CheckCircleIcon, HourglassHighIcon, Icon, CircleNotchIcon } from '@/components/ui';
import { Badge } from '@/components/ui/badge';

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
  orders, 
  emptyMessage, 
  loading = false 
}: TransactionSectionProps) {
  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center px-6">
        <Badge variant="secondary" className="inline-flex items-center gap-2 rounded-full bg-primary hover:bg-primary text-primary-foreground">
          <SectionIcon icon={icon} />
          <span>{title}</span>
        </Badge>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8 px-6">
          <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-8 px-6">
          <div className="text-muted-foreground mb-2">
            <SectionIcon icon={icon} />
          </div>
          <p className="text-sm text-muted-foreground">{emptyMessage}</p>
        </div>
      )}

      {/* Orders List */}
      {!loading && orders.length > 0 && (
        <div>
          {orders.map((order) => (
            <TransactionItem
              key={order.id}
              order={order}
              showTimestamp={true}
              compact={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}