'use client';

import React from 'react';
import type { AuthUser } from '@/types';
import { ArrowClockwiseIcon, CheckCircleIcon, CircleNotchIcon, Icon, PencilSimpleIcon, TrashIcon, UsersIcon, XCircleIcon } from '@/components/ui';

export interface UserListProps {
  users: AuthUser[];
  isLoading: boolean;
  onEdit?: (user: AuthUser) => void;
  onDelete?: (user: AuthUser) => void;
  onToggleActive?: (user: AuthUser) => void;
  onRefresh?: () => void;
  className?: string;
}

export function UserList({
  users,
  isLoading,
  onEdit,
  onDelete,
  onToggleActive,
  onRefresh,
  className = '',
}: UserListProps) {
  const formatDate = (date: Date | string): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(date));
  };

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

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Icon icon={CircleNotchIcon} size="xl" className="animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading users...</span>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium text-gray-900">Users ({users.length})</h2>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Icon icon={ArrowClockwiseIcon} size="sm" className="mr-1" />
            Refresh
          </button>
        )}
      </div>

      {/* Users List */}
      {users.length === 0 ? (
        <div className="text-center py-12">
          <UsersIcon size={48} className="mx-auto text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No users</h3>
          <p className="mt-1 text-sm text-gray-500">Get started by creating a new user.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 py-5 sm:p-6">
            <div className="space-y-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="flex items-center space-x-4">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-white">
                        {getInitials(user.name, user.email)}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-medium text-gray-900">
                        {user.name || user.email}
                      </h4>
                      <p className="text-sm text-gray-500">{user.email}</p>
                      <p className="text-xs text-gray-400">
                        Created {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-100 text-purple-800' 
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {user.role}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.active 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {user.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center space-x-1">
                      {onEdit && (
                        <button
                          onClick={() => onEdit(user)}
                          className="p-2 text-gray-400 hover:text-blue-600 focus:outline-none focus:text-blue-600 transition-colors"
                          title="Edit user"
                        >
                          <Icon icon={PencilSimpleIcon} size="sm" />
                        </button>
                      )}
                      
                      {onToggleActive && (
                        <button
                          onClick={() => onToggleActive(user)}
                          className={`p-2 transition-colors focus:outline-none ${
                            user.active 
                              ? 'text-gray-400 hover:text-red-600 focus:text-red-600' 
                              : 'text-gray-400 hover:text-green-600 focus:text-green-600'
                          }`}
                          title={user.active ? 'Deactivate user' : 'Activate user'}
                        >
                          {user.active ? (
                            <Icon icon={XCircleIcon} size="sm" />
                          ) : (
                            <Icon icon={CheckCircleIcon} size="sm" />
                          )}
                        </button>
                      )}
                      
                      {onDelete && (
                        <button
                          onClick={() => onDelete(user)}
                          className="p-2 text-gray-400 hover:text-red-600 focus:outline-none focus:text-red-600 transition-colors"
                          title="Delete user"
                        >
                          <Icon icon={TrashIcon} size="sm" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserList; 