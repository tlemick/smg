'use client';

import React, { useState, useEffect } from 'react';
import { UserList } from './UserList';
import { CreateUserForm } from './CreateUserForm';
import { UserEditModal } from './UserEditModal';
import { GameSessionManagement } from './GameSessionManagement';
import type { AuthUser } from '@/types';
import { CheckCircleIcon, GearIcon, Icon, ShieldCheckIcon, TargetIcon, UserIcon, UserPlusIcon, UsersIcon, XCircleIcon } from '@/components/ui';

export interface UserManagementProps {
  initialUsers?: AuthUser[];
  className?: string;
}

type TabType = 'users' | 'create' | 'sessions' | 'settings';

interface DeleteUserResponse {
  success: boolean;
  data?: {
    deletedUserId: string;
    message: string;
  };
  error?: string;
  timestamp?: string;
}

export function UserManagement({
  initialUsers = [],
  className = '',
}: UserManagementProps) {
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [users, setUsers] = useState<AuthUser[]>(initialUsers);
  const [editingUser, setEditingUser] = useState<AuthUser | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0,
    admins: 0,
    users: 0,
  });

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  // Calculate stats when users change
  useEffect(() => {
    const total = users.length;
    const active = users.filter(u => u.active).length;
    const inactive = total - active;
    const admins = users.filter(u => u.role === 'ADMIN').length;
    const usersCount = users.filter(u => u.role === 'USER').length;

    setStats({
      total,
      active,
      inactive,
      admins,
      users: usersCount,
    });
  }, [users]);

  const loadUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users');
      
      if (response.ok) {
        const userData = await response.json();
        setUsers(Array.isArray(userData) ? userData : []);
      } else {
        throw new Error('Failed to load users');
      }
    } catch (err: any) {
      console.error('Load users error:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserCreated = (newUser: AuthUser) => {
    setUsers(prev => [newUser, ...prev]);
    setSuccess('User created successfully!');
    setActiveTab('users'); // Switch to users tab to show the new user
    
    // Clear success message after a delay
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUserEdit = (user: AuthUser) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };

  const handleUserUpdated = (updatedUser: AuthUser) => {
    setUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
    setSuccess('User updated successfully!');
    
    // Clear success message after a delay
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleUserDelete = async (user: AuthUser) => {
    if (!window.confirm(`Are you sure you want to delete user "${user.name || user.email}"? This action cannot be undone.`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'DELETE',
      });

      const result: DeleteUserResponse = await response.json();

      if (result.success) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
        setSuccess('User deleted successfully!');
        
        // Clear success message after a delay
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || 'Failed to delete user');
        
        // Clear error message after a delay
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      console.error('Delete user error:', err);
      setError('Network error. Please try again.');
      
      // Clear error message after a delay
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserToggleActive = async (user: AuthUser) => {
    const newActiveState = !user.active;
    const action = newActiveState ? 'activate' : 'deactivate';
    
    if (!window.confirm(`Are you sure you want to ${action} user "${user.name || user.email}"?`)) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          active: newActiveState,
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUsers(prev => prev.map(u => u.id === user.id ? result.data.user : u));
        setSuccess(`User ${action}d successfully!`);
        
        // Clear success message after a delay
        setTimeout(() => setSuccess(null), 3000);
      } else {
        setError(result.error || `Failed to ${action} user`);
        
        // Clear error message after a delay
        setTimeout(() => setError(null), 5000);
      }
    } catch (err: any) {
      console.error(`${action} user error:`, err);
      setError('Network error. Please try again.');
      
      // Clear error message after a delay
      setTimeout(() => setError(null), 5000);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditModalClose = () => {
    setIsEditModalOpen(false);
    setEditingUser(null);
  };

  const tabs = [
    {
      id: 'users' as TabType,
      name: 'Users',
      icon: <Icon icon={UsersIcon} size="md" />,
      count: stats.total,
    },
    {
      id: 'create' as TabType,
      name: 'Create User',
      icon: <Icon icon={UserPlusIcon} size="md" />,
    },
    {
      id: 'sessions' as TabType,
      name: 'Game Sessions',
      icon: <Icon icon={TargetIcon} size="md" />,
    },
    {
      id: 'settings' as TabType,
      name: 'Settings',
      icon: <Icon icon={GearIcon} size="md" />,
    },
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-mono text-gray-900">User Management</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage users, roles, and system access
        </p>
      </div>

      {/* Global Messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon icon={XCircleIcon} size="md" className="text-red-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <Icon icon={CheckCircleIcon} size="md" className="text-green-400" />
            </div>
            <div className="ml-3">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon icon={UsersIcon} size="lg" className="text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.total}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon icon={CheckCircleIcon} size="lg" className="text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Active</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.active}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon icon={XCircleIcon} size="lg" className="text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Inactive</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.inactive}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon icon={ShieldCheckIcon} size="lg" className="text-purple-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Admins</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.admins}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Icon icon={UserIcon} size="lg" className="text-blue-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Regular Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.users}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`group inline-flex items-center py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              <span className="ml-2">{tab.name}</span>
              {tab.count !== undefined && (
                <span className={`ml-2 py-0.5 px-2.5 rounded-full text-xs ${
                  activeTab === tab.id
                    ? 'bg-blue-100 text-blue-600'
                    : 'bg-gray-100 text-gray-900'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-8">
        {activeTab === 'users' && (
          <UserList
            users={users}
            isLoading={isLoading}
            onEdit={handleUserEdit}
            onDelete={handleUserDelete}
            onToggleActive={handleUserToggleActive}
            onRefresh={loadUsers}
          />
        )}

        {activeTab === 'create' && (
          <CreateUserForm
            onCancel={() => setActiveTab('users')}
            onUserCreated={handleUserCreated}
          />
        )}

        {activeTab === 'sessions' && (
          <GameSessionManagement />
        )}

        {activeTab === 'settings' && (
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Settings</h3>
            <p className="text-gray-600">User management settings will be implemented here.</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      <UserEditModal
        user={editingUser}
        isOpen={isEditModalOpen}
        onClose={handleEditModalClose}
        onUserUpdated={handleUserUpdated}
      />
    </div>
  );
}

export default UserManagement; 