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
  loading = false,
  onCancelSuccess
}: TransactionSectionProps) {
  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center">
        <Badge variant="default" className="gap-2 rounded-full">
          <SectionIcon icon={icon} />
          <span>{title}</span>
        </Badge>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Icon icon={CircleNotchIcon} size="lg" className="animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading...</span>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="text-center py-8">
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
              onCancelSuccess={onCancelSuccess}
            />
          ))}
        </div>
      )}
    </div>
  );
}