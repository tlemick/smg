'use client';

import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { getZIndexClass } from '@/lib/z-index';
import { Icon, PlayIcon } from '@/components/ui';

type LessonTopic = 'Trading Basics' | 'Analysis Skills' | 'Portfolio Strategy' | 'Risk Management';

interface TikTokEmbedProps {
  storageKey: string;
  topic: LessonTopic;
  title?: string;
}

interface LessonDef {
  id: string;
  title: string;
  topic: LessonTopic;
  image: string;
  duration?: string;
}

const LESSONS: LessonDef[] = [
  { id: '1', title: 'Market Orders vs Limit Orders', topic: 'Trading Basics', image: '/tiktoks/noman-khan-Kq0BEr64SBc-unsplash 1.webp', duration: '1:58' },
  { id: '2', title: 'Reading Financial Statements', topic: 'Analysis Skills', image: '/tiktoks/todd-trapani-p9Vz9dyNbnU-unsplash 1.webp', duration: '4:20' },
  { id: '3', title: 'Building Your First Portfolio', topic: 'Portfolio Strategy', image: '/tiktoks/ella-don-nyCMLFMiokI-unsplash 1.webp', duration: '3:42' },
  { id: '4', title: 'Diversification Strategies', topic: 'Risk Management', image: '/tiktoks/videodeck-co-GRUhkcD9k8o-unsplash 1.webp', duration: '2:33' },
  { id: '5', title: 'Understanding Stock Basics', topic: 'Trading Basics', image: '/tiktoks/ato-aikins-7njkFeApWKA-unsplash 1.webp', duration: '2:15' },
];

export function TikTokEmbed({ storageKey, topic, title }: TikTokEmbedProps) {
  const [isVisible, setIsVisible] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved === 'hidden') {
        setIsVisible(false);
      }
    } catch {}
  }, [storageKey]);

  const lesson = useMemo(() => {
    const byTopic = LESSONS.find(l => l.topic === topic);
    return byTopic || LESSONS[0];
  }, [topic]);

  const handleDismiss = () => {
    setConfirmOpen(true);
  };

  const confirmDismiss = () => {
    setIsVisible(false);
    setConfirmOpen(false);
    try {
      localStorage.setItem(storageKey, 'hidden');
    } catch {}
  };

  const restore = () => {
    setIsVisible(true);
    try {
      localStorage.removeItem(storageKey);
    } catch {}
  };

  return (
    <div className="relative">
      {!isVisible && (
        <button
          aria-label="Show tip video"
          onClick={restore}
          className={`absolute -top-2 right-0 ${getZIndexClass('overlay')} rounded-full bg-neutral-200 hover:bg-neutral-300 text-neutral-700 w-8 h-8 flex items-center justify-center shadow-sm`}
          title="Show tip video"
        >
          <Icon icon={PlayIcon} size="sm" weight="fill" className="text-neutral-700" />
        </button>
      )}

      {isVisible && (
        <div className="relative aspect-[9/16] bg-neutral-900 rounded-2xl overflow-hidden group w-[200px]">
          <Image
            src={lesson.image}
            alt={lesson.title}
            fill
            className="object-cover"
            sizes="200px"
          />
          <div className="absolute inset-0 bg-black/40" />

          <div className="absolute inset-0 p-3 flex flex-col justify-between">
            <div className="flex items-start justify-between">
              <div className="px-2 py-0.5 rounded-full text-gray-900 text-xs font-medium bg-[#FEF100]">
                {topic}
              </div>
              {lesson.duration && (
                <div className="px-1.5 py-0.5 bg-black/50 rounded text-white text-[10px]">{lesson.duration}</div>
              )}
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center justify-center w-8 h-8 bg-white/90 rounded-full">
                <Icon icon={PlayIcon} size="sm" weight="fill" className="text-neutral-900 ml-[2px]" />
              </div>
              <button
                aria-label="Dismiss video"
                onClick={handleDismiss}
                className="text-white/80 hover:text-white text-xs"
              >
                Dismiss
              </button>
            </div>
          </div>

          {confirmOpen && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg p-4 w-full max-w-[220px] text-center shadow-lg">
                <p className="text-sm text-neutral-800 mb-3">Hide this tip video?</p>
                <div className="flex gap-2 justify-center">
                  <button
                    onClick={() => setConfirmOpen(false)}
                    className="px-3 py-1.5 text-sm rounded border border-neutral-300 text-neutral-700 hover:bg-neutral-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDismiss}
                    className="px-3 py-1.5 text-sm rounded bg-neutral-900 text-white hover:bg-neutral-800"
                  >
                    Hide
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}


