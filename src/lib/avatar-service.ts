/**
 * Avatar Service - Handles demo portrait assignment
 * 
 * For demo purposes, we assign avatars based on user ID hash
 * to ensure consistent assignment while appearing random
 */

// List of available avatar filenames (you'll upload these to public/avatars/)
const AVAILABLE_AVATARS = [
  'avatar-1.jpg',
  'avatar-2.jpg', 
  'avatar-3.jpg',
  'avatar-4.jpg',
  'avatar-5.jpg',
  'avatar-6.jpg',
  'avatar-7.jpg',
  'avatar-8.jpg',
  'avatar-9.jpg',
  'avatar-10.jpg',
  'avatar-11.jpg',
  'avatar-12.jpg',
];

/**
 * Get avatar URL for a user
 * Uses a simple hash of the user ID to ensure consistent assignment
 */
export function getUserAvatarUrl(userId: string): string {
  // Simple hash function to get consistent but seemingly random assignment
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    const char = userId.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  // Get positive index
  const index = Math.abs(hash) % AVAILABLE_AVATARS.length;
  const avatarFileName = AVAILABLE_AVATARS[index];
  
  return `/avatars/${avatarFileName}`;
}

/**
 * Get avatar URL with fallback
 */
export function getUserAvatarUrlWithFallback(userId: string): string {
  return getUserAvatarUrl(userId);
}

/**
 * Check if avatar exists (for future use)
 */
export function hasCustomAvatar(userId: string): boolean {
  // For demo, we'll assume all users have avatars
  return true;
}