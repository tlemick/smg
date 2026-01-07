'use client';

import {
  Button,
  Icon,
  CaretRightIcon,
  DotsThreeOutlineVerticalIcon,
  PencilSimpleIcon,
  TrashIcon,
} from '@/components/ui';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { WatchlistDetailed, WatchlistQuoteItem } from '@/types';
import { WatchlistTable } from './WatchlistTable';

interface WatchlistItemProps {
  watchlist: WatchlistDetailed;
  quotes: WatchlistQuoteItem[];
  holdings: Record<string, number>;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onManageAssets: () => void;
  onDelete: () => void;
}

export function WatchlistItem({
  watchlist,
  quotes,
  holdings,
  isExpanded,
  onToggleExpand,
  onManageAssets,
  onDelete,
}: WatchlistItemProps) {
  return (
    <Collapsible
      open={isExpanded}
      onOpenChange={onToggleExpand}
      className="overflow-hidden"
    >
      <CollapsibleTrigger asChild>
        <div className="w-full py-3 border-b border-muted-foreground flex items-center transition-colors cursor-pointer">
          <Icon
            icon={CaretRightIcon}
            size="sm"
            className={`text-muted-foreground transition-transform ${
              isExpanded ? 'transform rotate-90' : ''
            }`}
          />
          <span className="font-medium text-foreground ml-3">{watchlist.name}</span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 ml-3">
                <Icon icon={DotsThreeOutlineVerticalIcon} size="lg" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onManageAssets();
                }}
              >
                <Icon icon={PencilSimpleIcon} size="sm" className="mr-2" />
                Manage Assets
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="text-destructive focus:text-destructive"
              >
                <Icon icon={TrashIcon} size="sm" className="mr-2" />
                Delete Watchlist
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CollapsibleTrigger>

      <CollapsibleContent>
        {watchlist.items && watchlist.items.length > 0 ? (
          <WatchlistTable items={watchlist.items} quotes={quotes} holdings={holdings} />
        ) : (
          <div className="bg-card px-4 py-8 text-center border-t border-border rounded-b-md">
            <p className="text-muted-foreground mb-3">No assets in this watchlist yet</p>
            <Button variant="link" onClick={onManageAssets}>
              Add your first asset
            </Button>
          </div>
        )}
      </CollapsibleContent>
    </Collapsible>
  );
}
