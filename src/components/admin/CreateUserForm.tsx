'use client';

/**
 * CreateUserForm Component
 * Form for creating new users with password generation and validation
 */

import React, { useState } from 'react';
import type { AuthUser } from '@/types';

export interface CreateUserFormProps {
  onCancel: () => void;
  onUserCreated?: (user: AuthUser) => void;
  className?: string;
}

interface CreateUserResponse {
  success: boolean;
  data?: {
    user: AuthUser;
    temporaryPassword?: string;
    passwordGenerated?: boolean;
  };
  error?: string;
  timestamp?: string;
}

export function CreateUserForm({
  onCancel,
  onUserCreated,
  className = '',
}: CreateUserFormProps) {
  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'USER',
    password: '',
    generatePassword: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedPassword, setGeneratedPassword] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setGeneratedPassword(null);

    try {
      const payload: any = {
        email: formData.email,
        name: formData.name || null,
        role: formData.role,
        generatePassword: formData.generatePassword,
      };

      // Only include password if not generating one
      if (!formData.generatePassword && formData.password) {
        payload.password = formData.password;
      }

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result: CreateUserResponse = await response.json();

      if (result.success && result.data) {
        setSuccess('User created successfully!');
        
        // Show generated password if applicable
        if (result.data.temporaryPassword) {
          setGeneratedPassword(result.data.temporaryPassword);
        }
        
        if (onUserCreated) {
          onUserCreated(result.data.user);
        }
        
        // Auto-close after a short delay unless there's a generated password to show
        if (!result.data.temporaryPassword) {
          setTimeout(() => {
            onCancel();
          }, 1500);
        }
      } else {
        setError(result.error || 'Failed to create user');
      }
    } catch (err: any) {
      console.error('User creation error:', err);
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

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow p-6 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Create New User</h3>
      
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

      {generatedPassword && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900">Temporary Password Generated:</p>
              <p className="text-sm text-blue-700 font-mono mt-1">{generatedPassword}</p>
              <p className="text-xs text-blue-600 mt-1">Please save this password - it won't be shown again.</p>
            </div>
            <button
              onClick={() => copyToClipboard(generatedPassword)}
              className="ml-2 px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Copy
            </button>
          </div>
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
            placeholder="user@example.com"
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
            placeholder="John Doe"
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

        <div className="space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="generatePassword"
              name="generatePassword"
              checked={formData.generatePassword}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
            />
            <label htmlFor="generatePassword" className="ml-2 block text-sm text-gray-900">
              Generate temporary password
            </label>
          </div>

          {!formData.generatePassword && (
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required={!formData.generatePassword}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter password (min 8 characters)"
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
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading || (!formData.generatePassword && !formData.password)}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {isLoading ? 'Creating...' : 'Create User'}
          </button>
        </div>
      </form>

      {generatedPassword && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}

export default CreateUserForm; 