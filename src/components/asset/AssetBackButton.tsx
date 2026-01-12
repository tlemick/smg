'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from '@phosphor-icons/react';
import { Icon } from '@/components/ui/Icon';

/**
 * AssetBackButton Component
 * 
 * Simple back navigation button for asset detail pages.
 * 
 * Architecture Compliance:
 * - Pure UI component (no business logic)
 * - Uses Next.js router for navigation
 * - Follows component patterns (UI only)
 */
export function AssetBackButton() {
  const router = useRouter();
  
  return (
    <button
      onClick={() => router.back()}
      className="flex items-center gap-2 mt-1 text-muted-foreground hover:text-foreground transition-colors mb-4"
      aria-label="Go back to previous page"
    >
      <Icon icon={ArrowLeft} size="md" />
      <span>Back</span>
    </button>
  );
}
