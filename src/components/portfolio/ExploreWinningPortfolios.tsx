'use client';

import React from 'react';
import Image from 'next/image';

export function ExploreWinningPortfolios() {
  const portfolios = [
    {
      id: 1,
      name: 'Alex Davidson',
      school: 'Washington High, St. Louis',
      return: '+24%',
      favoriteAsset: 'Nvidia',
      worstPerformer: 'Meta, Inc',
      avatar: '/hero_images/full1.webp',
      badges: ['Strategic', 'Risk-Aware', 'Tech-Focused', 'Disciplined']
    },
    {
      id: 2,
      name: 'Sarah Chen',
      school: 'Lincoln Academy, Boston',
      return: '+31%',
      favoriteAsset: 'Apple',
      worstPerformer: 'Tesla',
      avatar: '/hero_images/full2.webp',
      badges: ['Diversified', 'Value-Driven', 'Patient', 'Analytical']
    }
  ];

  return (
    <div className="py-6 mt-40">
      <h2 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 mb-6">
        Explore past winning portfolios
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {portfolios.map((portfolio) => (
          <div 
            key={portfolio.id}
            className="rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-white dark:bg-neutral-800"
          >
            <div className="flex flex-col md:flex-row h-full min-h-[400px] relative"> {/* Add 'relative' here */}              
              {/* Left side - Info */}
              <div className="bg-gradient-to-br from-emerald-900/80 to-emerald-700/80 dark:from-emerald-800/80 dark:to-emerald-900/80 p-8 flex flex-col justify-between md:w-1/2">
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">
                    {portfolio.name}
                  </h3>
                  
                  <div className="space-y-4 text-white/90">
                    <div>
                      <div className="text-sm opacity-75">School</div>
                      <div className="font-medium">{portfolio.school}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm opacity-75">Return</div>
                      <div className="text-2xl font-bold">{portfolio.return}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm opacity-75">Favorite asset</div>
                      <div className="font-medium">{portfolio.favoriteAsset}</div>
                    </div>
                    
                    <div>
                      <div className="text-sm opacity-75">Worst performer</div>
                      <div className="font-medium">{portfolio.worstPerformer}</div>
                    </div>
                  </div>
                </div>
                
                <button className="mt-6 bg-white/20 hover:bg-white/30 text-white font-medium py-3 px-6 rounded-lg transition-colors backdrop-blur-sm">
                  Explore portfolio
                </button>
              </div>
              {/* Middle section - Image */}
              {/* This div is now absolutely positioned, allowing it to overlap without affecting flow */}
              <div className="absolute inset-y-0 left-[35%] md:w-[45%] z-2 flex items-center justify-center"> {/* Adjust left% and width as needed */}
                <div className="relative h-full w-full"> {/* Make inner div fill parent */}
                  <Image
                    src={portfolio.avatar}
                    alt={portfolio.name}
                    fill
                    className="object-cover object-center" // object-contain might be better here to prevent cropping the image itself
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              </div>
              {/* Right side - Badges */}
              <div className="md:w-[35%] relative bg-white dark:bg-neutral-800 flex justify-end h-full  flex-col ml-auto z-0"> {/* Adjusted width, ml-auto pushes it right, lower z-index */}                {/* Badges */}
                <div className="p-6">
                  <div className="flex flex-col gap-2 items-end">
                    {portfolio.badges.map((badge, index) => (
                      <span
                        key={index}
                        className="px-3 py-1.5 bg-neutral-400 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 rounded-full text-sm font-medium"
                      >
                        {badge}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExploreWinningPortfolios;


