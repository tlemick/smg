import { formatDistanceToNow } from 'date-fns';
import { ArrowClockwiseIcon, CircleNotchIcon, Icon, WarningCircleIcon } from '@/components/ui';

interface RefreshIndicatorProps {
  isRefreshing: boolean;
  lastUpdate: Date;
  onRefresh: () => void;
  quotesCount?: number;
  error?: string | null;
}

export const RefreshIndicator = ({ 
  isRefreshing, 
  lastUpdate, 
  onRefresh, 
  quotesCount = 0,
  error 
}: RefreshIndicatorProps) => {
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center justify-between">
        {/* Status and last update info */}
        <div className="flex items-center space-x-3">
          {/* Status indicator dot */}
          <div className={`w-3 h-3 rounded-full ${
            error 
              ? 'bg-red-500' 
              : isRefreshing 
                ? 'bg-blue-500 animate-pulse' 
                : 'bg-green-500'
          }`} />
          
          {/* Status text */}
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">
              {error ? (
                'Error fetching quotes'
              ) : isRefreshing ? (
                'Refreshing quotes...'
              ) : (
                `${quotesCount} quotes loaded`
              )}
            </span>
            
            {!error && (
              <span className="text-xs text-gray-500">
                Updated {formatDistanceToNow(lastUpdate, { addSuffix: true })}
              </span>
            )}
          </div>
        </div>

        {/* Refresh button */}
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className={`
            flex items-center space-x-2 px-4 py-2 rounded-md font-medium transition-all duration-200
            ${isRefreshing 
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
              : 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-md active:scale-95'
            }
          `}
        >
          {/* Refresh icon */}
          <Icon
            icon={isRefreshing ? CircleNotchIcon : ArrowClockwiseIcon}
            size="sm"
            className={isRefreshing ? 'animate-spin' : ''}
          />
          
          {/* Button text */}
          <span className="text-sm">
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </span>
        </button>
      </div>

      {/* Error message display */}
      {error && (
        <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <Icon icon={WarningCircleIcon} size="sm" className="text-red-500 mr-2" />
            <span className="text-sm text-red-700">{error}</span>
          </div>
        </div>
      )}

      {/* Cache info for transparency */}
      {!isRefreshing && !error && quotesCount > 0 && (
        <div className="mt-2 text-xs text-gray-400">
          Batch fetching optimized • 10-second cache prevents spam
        </div>
      )}
    </div>
  );
}; 