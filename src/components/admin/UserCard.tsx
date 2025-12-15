'use client';

/**
 * UserCard Component
 * Individual user display component with actions and status indicators
 */

import React from 'react';
import type { AuthUser } from '@/types';
import { CheckCircleIcon, Icon, PencilSimpleIcon, TrashIcon, XCircleIcon } from '@/components/ui';

export interface UserCardProps {
  user: AuthUser;
  onEdit?: (user: AuthUser) => void;
  onDeactivate?: (user: AuthUser) => void;
  onActivate?: (user: AuthUser) => void;
  onDelete?: (user: AuthUser) => void;
  showActions?: boolean;
  compact?: boolean;
  className?: string;
}

export function UserCard({
  user,
  onEdit,
  onDeactivate,
  onActivate,
  onDelete,
  showActions = true,
  compact = false,
  className = '',
}: UserCardProps) {
  // Generate user initials for avatar
  const getInitials = (name: string | null, email: string): string => {
    if (name) {
      return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  // Get role color
  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-800';
      case 'USER':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get status color
  const getStatusColor = (active: boolean): string => {
    return active
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  // Format date
  const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

  const initials = getInitials(user.name, user.email);

  if (compact) {
    return (
      <div className={`flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow ${className}`}>
        {/* User Info */}
        <div className="flex items-center space-x-3">
          {/* Avatar */}
          <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
            <span className="text-sm font-medium text-white">{initials}</span>
          </div>
          
          {/* Details */}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user.name || user.email}
            </p>
            <p className="text-sm text-gray-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Status and Role */}
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
            {user.role}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.active)}`}>
            {user.active ? 'Active' : 'Inactive'}
          </span>
        </div>

        {/* Quick Actions */}
        {showActions && (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => onEdit?.(user)}
              className="p-1 text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600"
              title="Edit user"
            >
              <Icon icon={PencilSimpleIcon} size="sm" />
            </button>
            {user.active ? (
              <button
                onClick={() => onDeactivate?.(user)}
                className="p-1 text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600"
                title="Deactivate user"
              >
                <Icon icon={XCircleIcon} size="sm" />
              </button>
            ) : (
              <button
                onClick={() => onActivate?.(user)}
                className="p-1 text-gray-400 hover:text-green-600 focus:outline-none focus:text-green-600"
                title="Activate user"
              >
                <Icon icon={CheckCircleIcon} size="sm" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow ${className}`}>
      {/* Header */}
      <div className="p-6">
        <div className="flex items-start justify-between">
          {/* User Info */}
          <div className="flex items-start space-x-4">
            {/* Avatar */}
            <div className="flex-shrink-0 h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <span className="text-xl font-medium text-white">{initials}</span>
            </div>
            
            {/* Details */}
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-medium text-gray-900">
                {user.name || 'No name set'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">{user.email}</p>
              <p className="text-xs text-gray-400 mt-1">ID: {user.id}</p>
            </div>
          </div>

          {/* Status Badges */}
          <div className="flex flex-col space-y-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
              {user.role}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(user.active)}`}>
              {user.active ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-500">Created:</span>
            <p className="text-gray-900 mt-1">{formatDate(user.createdAt)}</p>
          </div>
          <div>
            <span className="font-medium text-gray-500">Updated:</span>
            <p className="text-gray-900 mt-1">{formatDate(user.updatedAt)}</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      {showActions && (
        <div className="px-6 py-4 border-t border-gray-200">
          <div className="flex justify-between items-center">
            <div className="flex space-x-3">
              <button
                onClick={() => onEdit?.(user)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Icon icon={PencilSimpleIcon} size="sm" className="mr-1.5" />
                Edit
              </button>
              
              {user.active ? (
                <button
                  onClick={() => onDeactivate?.(user)}
                  className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <Icon icon={XCircleIcon} size="sm" className="mr-1.5" />
                  Deactivate
                </button>
              ) : (
                <button
                  onClick={() => onActivate?.(user)}
                  className="inline-flex items-center px-3 py-2 border border-green-300 shadow-sm text-sm leading-4 font-medium rounded-md text-green-700 bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                >
                  <Icon icon={CheckCircleIcon} size="sm" className="mr-1.5" />
                  Activate
                </button>
              )}
            </div>

            {/* Danger Actions */}
            {onDelete && (
              <button
                onClick={() => onDelete(user)}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                <Icon icon={TrashIcon} size="sm" className="mr-1.5" />
                Delete
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default UserCard; 