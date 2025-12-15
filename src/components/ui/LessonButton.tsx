'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Image from 'next/image';
import { TikTokLessons } from '@/components/dashboard/TikTokLessons';
import { createModalClasses, createModalHandlers } from '@/lib/positioning';
import { getZIndexClass } from '@/lib/z-index';

interface LessonButtonProps {
  /** Text to display on the button */
  text: string;
  /** Topics to pass to TikTokLessons component */
  topics: string[];
  /** Maximum number of items for TikTokLessons */
  maxItems?: number;
  /** Optional custom content for the right side of the modal */
  modalContent?: React.ReactNode;
  /** Whether to use single or dual column layout in modal */
  modalLayout?: 'single' | 'dual';
}

export function LessonButton({
  text,
  topics,
  maxItems = 1,
  modalContent,
  modalLayout = 'dual'
}: LessonButtonProps) {
  const [isLessonsOpen, setIsLessonsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [lessonAvatar, setLessonAvatar] = useState<string | null>(null);

  // Ensure portal only renders on client
  useEffect(() => setIsMounted(true), []);

  // Pick a random avatar from /public/avatars on mount
  useEffect(() => {
    const totalAvatars = 12;
    const randomIndex = Math.floor(Math.random() * totalAvatars) + 1;
    setLessonAvatar(`/avatars/avatar-${randomIndex}.jpg`);
  }, []);


  const button = (
    <button
      onClick={() => setIsLessonsOpen(true)}
      className="pl-1 pr-2 py-1 text-xs rounded-full border-2 font-medium bg-white border-gray-900 text-gray-700 hover:bg-gray-50 inline-flex items-center gap-2 shadow-sm"
      title="Open quick lesson"
    >
      {lessonAvatar && (
        <Image
          src={lessonAvatar}
          alt="Lesson avatar"
          width={20}
          height={20}
          className="h-6 w-6 rounded-full object-cover"
        />
      )}
      <span>{text}</span>
    </button>
  );

  // Just return the button - no complex positioning needed
  const positionedButton = button;

  return (
    <>
      {positionedButton}

      {/* Lessons Modal */}
      {isLessonsOpen && isMounted && createPortal(
        <div 
          className={createModalClasses().backdrop} 
          onClick={createModalHandlers(() => setIsLessonsOpen(false)).backdropClick}
        >
          <div className={createModalClasses().container}>
            <button
              onClick={() => setIsLessonsOpen(false)}
              className={`absolute top-4 right-4 text-gray-100 hover:text-white bg-black/40 hover:bg-black/60 rounded-full w-10 h-10 flex items-center justify-center ${getZIndexClass('modalNested')}`}
              aria-label="Close"
            >
              ✕
            </button>
            
            {modalLayout === 'single' ? (
              <div 
                className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full max-h-[80vh] overflow-y-auto"
                onClick={createModalHandlers(() => setIsLessonsOpen(false)).contentClick}
              >
                <div className="w-full">
                  <TikTokLessons topics={topics} maxItems={maxItems} />
                </div>
              </div>
            ) : (
              <div 
                className="grid grid-cols-1 lg:grid-cols-2 h-full max-w-6xl w-full max-h-[80vh] bg-white rounded-lg shadow-xl overflow-hidden"
                onClick={createModalHandlers(() => setIsLessonsOpen(false)).contentClick}
              >
                {/* Left: Video area */}
                <div className="flex items-center justify-center p-6">
                  <div className="w-full max-w-sm">
                    <TikTokLessons topics={topics} maxItems={maxItems} />
                  </div>
                </div>
                {/* Right: Content area */}
                <div className="border-t lg:border-t-0 lg:border-l border-gray-200 flex items-center p-8 overflow-y-auto">
                  {modalContent || (
                    <div className="flex flex-col gap-2 p-8">
                      <h3 className="text-lg font-semibold text-gray-900">Understanding the Topic</h3>
                      <p className="mt-2 text-sm text-gray-600 max-w-prose">
                        Learn more about this topic through our educational content.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
