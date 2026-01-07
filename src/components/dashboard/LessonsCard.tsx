'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Icon, PlayIcon } from '@/components/ui';
import { TikTokLesson, TikTokLessonCardProps } from '@/types';

// Educational financial topics for the TikTok-style lessons
const lessons: TikTokLesson[] = [
  {
    id: '1',
    title: 'Understanding Stock Basics',
    topic: 'Stock Market 101',
    image: '/tiktoks/ato-aikins-7njkFeApWKA-unsplash 1.webp',
    duration: '2:15'
  },
  {
    id: '2', 
    title: 'Building Your First Portfolio',
    topic: 'Portfolio Strategy',
    image: '/tiktoks/ella-don-nyCMLFMiokI-unsplash 1.webp',
    duration: '3:42'
  },
  {
    id: '3',
    title: 'Market Orders vs Limit Orders',
    topic: 'Trading Basics',
    image: '/tiktoks/noman-khan-Kq0BEr64SBc-unsplash 1.webp',
    duration: '1:58'
  },
  {
    id: '4',
    title: 'Reading Financial Statements',
    topic: 'Analysis Skills',
    image: '/tiktoks/todd-trapani-p9Vz9dyNbnU-unsplash 1.webp',
    duration: '4:20'
  },
  {
    id: '5',
    title: 'Diversification Strategies',
    topic: 'Risk Management',
    image: '/tiktoks/videodeck-co-GRUhkcD9k8o-unsplash 1.webp',
    duration: '2:33'
  }
];

function TikTokLessonCard({ lesson, onClick }: TikTokLessonCardProps) {
  return (
    <div 
      className="relative aspect-[9/16] bg-card rounded-2xl overflow-hidden cursor-pointer group transition-transform hover:scale-105"
      onClick={onClick}
    >
      {/* Background Image */}
      <Image
        src={lesson.image}
        alt={lesson.title}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 20vw, 16vw"
      />
      
      {/* Dark overlay for better text readability */}
      <div className="absolute inset-0 bg-black/40" />
      
      {/* Content overlay */}
      <div className="absolute inset-0 p-4 flex flex-col justify-between">
        {/* Top section - Topic label */}
        <div className="flex justify-between items-start">
          <div className="px-3 py-1 rounded-full text-foreground text-sm font-medium bg-[#FEF100]">
            {lesson.topic}
          </div>
          {lesson.duration && (
            <div className="px-2 py-1 bg-black/50 rounded text-white text-xs">
              {lesson.duration}
            </div>
          )}
        </div>
        
        {/* Bottom section - Title and play button */}
        <div className="space-y-3">
          {/* Play button */}
          <div className="flex items-center justify-center w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full group-hover:bg-white transition-colors">
            <Icon icon={PlayIcon} size="lg" weight="fill" className="text-foreground ml-1" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface LessonsCardProps {
  title?: string;
  subtitle?: string;
  topics?: string[];
  maxItems?: number;
}

export function LessonsCard({ 
  title = 'Listen to some friends.', 
  subtitle = 'These winners from last year have some advice for you.', 
  topics = [], 
  maxItems 
}: LessonsCardProps) {
  const handleLessonClick = (lesson: TikTokLesson) => {
    console.log('Opening lesson:', lesson.title);
  };

  const filteredBase = topics.length > 0
    ? lessons.filter((l) => topics.includes(l.topic))
    : lessons;
  const filtered = typeof maxItems === 'number' ? filteredBase.slice(0, maxItems) : filteredBase;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {subtitle && <CardDescription>{subtitle}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-none xl:grid-flow-col xl:auto-cols-[220px] xl:overflow-x-auto xl:pb-2 gap-4">
          {filtered.map((lesson) => (
            <TikTokLessonCard
              key={lesson.id}
              lesson={lesson}
              onClick={() => handleLessonClick(lesson)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
