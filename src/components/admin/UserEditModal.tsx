'use client';

import React, { useState, useEffect } from 'react';
import type { AuthUser } from '@/types';
import { createModalClasses, createModalHandlers } from '@/lib/positioning';

export interface UserEditModalProps {
  user: AuthUser | null;
  isOpen: boolean;
  onClose: () => void;
  onUserUpdated?: (user: AuthUser) => void;
}

interface UpdateUserResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    passwordChanged?: boolean;
  };
  error?: string;
  timestamp?: string;
}

export function UserEditModal({
  user,
  isOpen,
  onClose,
  onUserUpdated,
}: UserEditModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'USER',
    active: true,
    password: '',
    changePassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Reset form when modal opens/closes or user changes
  useEffect(() => {
    if (isOpen && user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        role: user.role || 'USER',
        active: user.active ?? true,
        password: '',
        changePassword: false,
      });
      setError(null);
      setSuccess(null);
    }
  }, [isOpen, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const payload: any = {
        name: formData.name || null,
        email: formData.email,
        role: formData.role,
        active: formData.active,
      };

      // Only include password if user wants to change it
      if (formData.changePassword && formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch(`/api/admin/users/${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result: UpdateUserResponse = await response.json();

      if (result.success && result.data) {
        setSuccess('User updated successfully!');
        
        if (onUserUpdated) {
          onUserUpdated(result.data.user);
        }
        
        // Auto-close after a short delay
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setError(result.error || 'Failed to update user');
      }
    } catch (err: any) {
      console.error('User update error:', err);
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({
        ...prev,
        [name]: checked
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className={createModalClasses().backdrop} onClick={createModalHandlers(onClose).backdropClick}>
      <div className={createModalClasses().container}>
        <div className={`${createModalClasses().content} w-96`} onClick={createModalHandlers(onClose).contentClick}>
        <div className="mt-3">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Edit User: {user.name || user.email}
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-700">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address *
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Leave empty for no name"
              />
            </div>

            <div>
              <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                Role
              </label>
              <select
                id="role"
                name="role"
                value={formData.role}
                onChange={handleInputChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="USER">User</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="active"
                name="active"
                checked={formData.active}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="active" className="ml-2 block text-sm text-gray-900">
                Active
              </label>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center mb-3">
                <input
                  type="checkbox"
                  id="changePassword"
                  name="changePassword"
                  checked={formData.changePassword}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="changePassword" className="ml-2 block text-sm text-gray-900">
                  Change password
                </label>
              </div>

              {formData.changePassword && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                    New Password *
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={formData.changePassword}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Enter new password (min 8 characters)"
                    minLength={8}
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Password must be at least 8 characters long
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || (formData.changePassword && !formData.password)}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
        </div>
      </div>
    </div>
  );
}

export default UserEditModal; 