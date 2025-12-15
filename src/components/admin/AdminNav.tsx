'use client';

import React, { useState } from 'react';
import { useUser } from '@/context/UserContext';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { DesktopIcon, FileTextIcon, GaugeIcon, HouseIcon, Icon, ListIcon, SignOutIcon, UsersIcon, XIcon } from '@/components/ui';

export interface AdminNavProps {
  className?: string;
}

export function AdminNav({
  className = '',
}: AdminNavProps) {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin',
      icon: <Icon icon={GaugeIcon} size="md" />,
    },
    {
      name: 'Users',
      href: '/admin/users',
      icon: <Icon icon={UsersIcon} size="md" />,
    },
    {
      name: 'Reports',
      href: '/admin/reports',
      icon: <Icon icon={FileTextIcon} size="md" />,
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: <Icon icon={DesktopIcon} size="md" />,
    },
  ];

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

  const isActive = (href: string): boolean => {
    if (href === '/admin') {
      return pathname === '/admin';
    }
    return pathname.startsWith(href);
  };

  // Show a basic nav even if no user is logged in (for demo purposes)
  const displayUser = user || { name: 'Demo User', email: 'demo@example.com', role: 'ADMIN' };

  return (
    <nav className={`bg-white shadow ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Left side - Logo and main nav */}
          <div className="flex">
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center">
              <Link href="/admin" className="text-xl font-bold text-gray-900">
                SMG Admin
              </Link>
            </div>

            {/* Desktop navigation */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`${
                    isActive(item.href)
                      ? 'border-blue-500 text-gray-900'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium`}
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side - User menu */}
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {/* Admin badge */}
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-4">
              Administrator
            </span>

            {/* User info */}
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0 h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {getInitials(displayUser.name, displayUser.email)}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {displayUser.name || displayUser.email}
                </span>
                <span className="text-xs text-gray-500">{displayUser.email}</span>
              </div>
            </div>

            {/* Back to dashboard button */}
            <Link
              href="/dashboard"
              className="ml-4 inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Icon icon={HouseIcon} size="sm" className="mr-1" />
              Dashboard
            </Link>

            {/* Logout button (only if user is logged in) */}
            {user && (
              <button
                onClick={logout}
                className="ml-2 inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Icon icon={SignOutIcon} size="sm" className="mr-1" />
                Logout
              </button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
              aria-expanded="false"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <Icon icon={XIcon} size="lg" />
              ) : (
                <Icon icon={ListIcon} size="lg" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`${
                  isActive(item.href)
                    ? 'bg-blue-50 border-blue-500 text-blue-700'
                    : 'border-transparent text-gray-600 hover:bg-gray-50 hover:border-gray-300 hover:text-gray-800'
                } block pl-3 pr-4 py-2 border-l-4 text-base font-medium`}
              >
                <div className="flex items-center">
                  <span className="mr-3">{item.icon}</span>
                  {item.name}
                </div>
              </Link>
            ))}
          </div>
          
          {/* Mobile user section */}
          <div className="pt-4 pb-3 border-t border-gray-200">
            <div className="flex items-center px-4">
              <div className="flex-shrink-0 h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                <span className="text-sm font-medium text-white">
                  {getInitials(displayUser.name, displayUser.email)}
                </span>
              </div>
              <div className="ml-3">
                <div className="text-base font-medium text-gray-800">
                  {displayUser.name || displayUser.email}
                </div>
                <div className="text-sm font-medium text-gray-500">{displayUser.email}</div>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              <Link
                href="/"
                className="block px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              >
                Back to Site
              </Link>
              {user && (
                <button
                  onClick={logout}
                  className="block w-full text-left px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                >
                  Logout
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default AdminNav; 