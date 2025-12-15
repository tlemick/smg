'use client';

import { ActivityItemProps } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import {
  Icon,
  CaretRightIcon,
  ClockIcon,
  CurrencyDollarIcon,
  InfoIcon,
  MinusIcon,
  PlusIcon,
  TrendDownIcon,
  TrendUpIcon,
  TrophyIcon,
  WarningCircleIcon,
  XIcon,
} from '@/components/ui';

// Icon components for different activity types
const ActivityIcon = ({ icon, color }: { icon?: string; color?: string }) => {
  const getIconComponent = () => {
    switch (icon) {
      case 'buy':
        return <Icon icon={PlusIcon} size="md" />;
      case 'sell':
        return <Icon icon={MinusIcon} size="md" />;
      case 'pending':
        return <Icon icon={ClockIcon} size="md" />;
      case 'clock':
        return <Icon icon={ClockIcon} size="md" />;
      case 'cancel':
        return <Icon icon={XIcon} size="md" />;
      case 'expired':
        return <Icon icon={WarningCircleIcon} size="md" />;
      case 'milestone':
        return <Icon icon={TrophyIcon} size="md" />;
      case 'trending_up':
        return <Icon icon={TrendUpIcon} size="md" />;
      case 'trending_down':
        return <Icon icon={TrendDownIcon} size="md" />;
      case 'cash':
        return <Icon icon={CurrencyDollarIcon} size="md" />;
      default:
        return <Icon icon={InfoIcon} size="md" />;
    }
  };

  const getColorClasses = () => {
    switch (color) {
      case 'success':
        return 'bg-green-100 text-green-600';
      case 'error':
        return 'bg-red-100 text-red-600';
      case 'warning':
        return 'bg-yellow-100 text-yellow-600';
      case 'info':
        return 'bg-blue-100 text-blue-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  return (
    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${getColorClasses()}`}>
      {getIconComponent()}
    </div>
  );
};

export function ActivityItem({ 
  activity, 
  onMarkRead, 
  onAction, 
  showTimestamp = true, 
  compact = false 
}: ActivityItemProps) {
  const router = useRouter();

  const handleClick = () => {
    // Mark as read when clicked
    if (!activity.read && onMarkRead) {
      onMarkRead(activity.id);
    }

    // Handle action if there's an actionUrl
    if (activity.actionUrl && onAction) {
      onAction(activity.actionUrl);
    } else if (activity.actionUrl) {
      router.push(activity.actionUrl);
    }
  };

  const formatDate = (dateStr: string | Date) => {
    const date = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
    return formatDistanceToNow(date, { addSuffix: true });
  };

  const getImportanceStyle = () => {
    if (activity.importance >= 3) {
      return 'border-l-4 border-blue-500 bg-blue-50';
    } else if (activity.importance >= 2) {
      return 'border-l-4 border-green-500 bg-green-50';
    }
    return 'border-l-4 border-gray-300 bg-gray-50';
  };

  return (
    <div
      className={`
        relative p-4 border border-gray-200 rounded-lg transition-all duration-200
        ${activity.actionUrl ? 'cursor-pointer hover:bg-gray-50 hover:shadow-md' : ''}
        ${!activity.read ? 'bg-blue-50 border-blue-200' : 'bg-white'}
        ${compact ? 'p-3' : 'p-4'}
        ${getImportanceStyle()}
      `}
      onClick={handleClick}
    >
      <div className="flex items-start space-x-3">
        {/* Activity Icon */}
        <ActivityIcon icon={activity.icon} color={activity.color} />

        {/* Activity Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium text-gray-900 ${compact ? 'text-sm' : 'text-base'}`}>
              {activity.title}
              {!activity.read && (
                <span className="ml-2 inline-block w-2 h-2 bg-blue-500 rounded-full"></span>
              )}
            </h4>
            {showTimestamp && (
              <span className="text-xs text-gray-500 flex-shrink-0 ml-4">
                {formatDate(activity.createdAt)}
              </span>
            )}
          </div>

          {activity.description && (
            <p className={`text-gray-600 mt-1 ${compact ? 'text-xs' : 'text-sm'}`}>
              {activity.description}
            </p>
          )}

          {/* Related Asset Info */}
          {activity.relatedAsset && (
            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                {activity.relatedAsset.ticker}
              </span>
              <span className="text-xs text-gray-500">
                {activity.relatedAsset.name}
              </span>
            </div>
          )}

          {/* Activity Type Badge */}
          <div className="mt-2 flex items-center justify-between">
            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
              activity.type === 'TRADE' 
                ? 'bg-blue-100 text-blue-800'
                : activity.type === 'PORTFOLIO'
                ? 'bg-green-100 text-green-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {activity.type.toLowerCase()}
            </span>

            {activity.actionUrl && (
              <div className="flex items-center text-xs text-blue-600">
                <span>View details</span>
                <Icon icon={CaretRightIcon} size="sm" className="ml-1" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 