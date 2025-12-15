'use client';

import { useState } from 'react';
import Image from 'next/image';

interface CompanyLogoProps {
  ticker: string;
  companyName?: string;
  logoUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function CompanyLogo({ 
  ticker, 
  logoUrl, 
  size = 'md',
  className = '' 
}: CompanyLogoProps) {
  const [imageError, setImageError] = useState(false);
  
  // Debug logging (remove in production)
  if (process.env.NODE_ENV === 'development') {
    console.log(`CompanyLogo for ${ticker}:`, { logoUrl, imageError });
  }

  // Size configurations
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm', 
    lg: 'w-12 h-12 text-base'
  };

  // Fallback: Show first 1-2 letters of ticker
  const getFallbackInitials = () => {
    return ticker.length <= 2 ? ticker : ticker.slice(0, 2);
  };

  // If we have a logo URL and no error, show the image
  if (logoUrl && !imageError) {
    return (
      <div className={`${sizeClasses[size]} flex-shrink-0 relative ${className}`}>
        <Image
          src={logoUrl}
          alt={`${ticker} logo`}
          fill
          className="object-contain grayscale transition-all duration-200"
          onError={() => setImageError(true)}
          sizes="48px"
        />
      </div>
    );
  }

  // Fallback: Show ticker initials in a simple container
  return (
    <div 
      className={`
        ${sizeClasses[size]} 
        flex-shrink-0 
        flex items-center justify-center 
        bg-gray-200 
        text-gray-700 
        font-medium 
        rounded 
        ${className}
      `}
    >
      {getFallbackInitials()}
    </div>
  );
}