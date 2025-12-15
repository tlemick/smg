'use client';

import Link from 'next/link';

export function LessonsPreview() {
  // Placeholder lesson data
  const featuredLesson = {
    title: "Understanding P/E Ratios",
    description: "Learn how to evaluate stocks using price-to-earnings ratios and what they tell you about market sentiment.",
    duration: "8 min read",
    difficulty: "Beginner",
    progress: 65 // percentage completed
  };

  const quickTips = [
    "Diversification reduces risk across your portfolio",
    "Dollar-cost averaging can help smooth out market volatility",
    "Research a company's fundamentals before investing"
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold">Learning Center</h2>
        <Link
          href="/lessons"
          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
        >
          View All →
        </Link>
      </div>

      {/* Featured Lesson */}
      <div className="border border-gray-200 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="font-semibold text-gray-800 mb-1">{featuredLesson.title}</h3>
            <p className="text-sm text-gray-600 mb-2">{featuredLesson.description}</p>
            <div className="flex items-center space-x-4 text-xs text-gray-500">
              <span>📚 {featuredLesson.difficulty}</span>
              <span>⏱️ {featuredLesson.duration}</span>
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-sm text-gray-600 mb-1">
            <span>Progress</span>
            <span>{featuredLesson.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full" 
              style={{ width: `${featuredLesson.progress}%` }}
            ></div>
          </div>
        </div>

        <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 text-sm font-medium">
          Continue Learning
        </button>
      </div>

      {/* Quick Tips */}
      <div>
        <h3 className="text-lg font-medium text-gray-800 mb-3">💡 Quick Tips</h3>
        <div className="space-y-2">
          {quickTips.map((tip, index) => (
            <div key={index} className="flex items-start space-x-2">
              <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0"></div>
              <p className="text-sm text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
        <p className="text-sm text-gray-600">
          <span className="font-medium">12 lessons</span> completed • <span className="font-medium">8 remaining</span>
        </p>
      </div>
    </div>
  );
} 