'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/context/UserContext';
import { GlobalSearchBar } from './GlobalSearchBar';
import { getUserAvatarUrl } from '@/lib/avatar-service';
import { BellIcon, DiscordLogoIcon, Icon, ListIcon, MagnifyingGlassIcon, ShieldCheckIcon, SignOutIcon, ThemeToggle, XIcon } from '@/components/ui';
import { getZIndexClass } from '@/lib/z-index';

interface MainNavigationProps {
  className?: string;
}

export function MainNavigation({ className = '' }: MainNavigationProps) {
  const { user, logout } = useUser();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

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

  const handleAdminClick = () => {
    router.push('/admin');
  };

  const navigationItems = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Portfolio', href: '/portfolio' },
    { name: 'Trade', href: '/trade' },
    { name: 'News', href: '/news' },
  ];

  const isActiveRoute = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <div className={`border-b border-border bg-background/80 backdrop-blur ${className}`}>
      <div className="container">
        <div className="flex justify-between items-center h-20">
          
          {/* Left side - Logo and Navigation */}
          <div className="flex items-center space-x-8">
            {/* SMG Logo */}
            <Link href="/dashboard" className="flex items-center space-x-2 text-foreground hover:text-primary transition-colors">
              <Image
                    src={"/logo.png"}
                    alt={"home"}
                    width={24}
                    height={24}
                    className="flex-shrink-0 h-6 w-6"
                />
              <div className="flex items-center pl-2 justify-center w-8 h-8 text-foreground">
                SMG
              </div>
            </Link>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={` mx-4 py-2 text-sm font-medium transition-colors ${
                    isActiveRoute(item.href)
                      ? 'text-foreground border-b-2 border-primary'
                      : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Center - Search Bar (Desktop) */}
          <div className="hidden md:block flex-1 max-w-xl mx-8">
            <GlobalSearchBar />
          </div>

          {/* Right side - User Navigation */}
          <div className="flex items-center space-x-3">
            
            {/* Mobile Search Icon */}
            <button className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors">
              <Icon icon={MagnifyingGlassIcon} size="md" />
            </button>

            {/* Theme Toggle */}
            <ThemeToggle variant="icon" />

            {/* Notifications */}
            <button
              className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors relative"
              aria-label="Notifications"
            >
              <Icon icon={BellIcon} size="md" />
              {/* Notification dot - you can conditionally show this */}
              {/* <div className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></div> */}
            </button>

            {/* Discord */}
            <button
              className="hidden md:flex p-2 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Discord"
            >
              <DiscordLogoIcon size={24} weight="fill" className="text-current" />
            </button>

            {/* Admin Button (if user is admin) */}
            {user?.role === 'ADMIN' && (
              <button
                onClick={handleAdminClick}
                className="hidden md:inline-flex items-center px-3 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
              >
                <Icon icon={ShieldCheckIcon} size="sm" className="mr-1" />
                Admin
              </button>
            )}

            {/* User Avatar + Dropdown */}
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((v) => !v)}
                className="flex items-center focus:outline-none"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
                disabled={!user?.id}
              >
                {user?.id ? (
                  <Image
                    src={getUserAvatarUrl(user.id)}
                    alt={`${user.name || user.email}'s avatar`}
                    width={32}
                    height={32}
                    className="flex-shrink-0 h-8 w-8 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex-shrink-0 h-8 w-8 bg-muted rounded-full flex items-center justify-center border border-border" />
                )}
              </button>
              {isUserMenuOpen && user?.id && (
                <div className={`absolute right-0 mt-2 w-40 bg-popover text-popover-foreground border border-border rounded-md shadow-lg ${getZIndexClass('dropdown')}`}>
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full flex items-center px-3 py-2 text-sm hover:bg-muted"
                  >
                    <Icon icon={SignOutIcon} size="sm" className="mr-2" />
                    Logout
                  </button>
                </div>
              )}
            </div>

            {/* Logout moved into user dropdown */}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? (
                <Icon icon={XIcon} size="md" />
              ) : (
                <Icon icon={ListIcon} size="md" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            {/* Mobile Search */}
            <div className="px-4 py-3 bg-muted">
              <GlobalSearchBar />
            </div>
            
            {/* Mobile Navigation */}
            <div className="px-2 pt-2 pb-3 space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-3 py-2 rounded-lg text-base font-medium transition-colors ${
                    isActiveRoute(item.href)
                      ? 'text-primary bg-primary/10'
                      : 'text-foreground hover:text-primary hover:bg-muted'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Mobile User Section */}
            <div className="pt-4 pb-3 border-t border-border bg-muted">
              <div className="flex items-center px-5">
                {user?.id ? (
                  <Image
                    src={getUserAvatarUrl(user.id)}
                    alt={`${user.name || user.email}'s avatar`}
                    width={40}
                    height={40}
                    className="flex-shrink-0 h-10 w-10 rounded-full border border-border object-cover"
                  />
                ) : (
                  <div className="flex-shrink-0 h-10 w-10 bg-background rounded-full flex items-center justify-center border border-border">
                    {/* Fallback for when no user */}
                  </div>
                )}
                <div className="ml-3">
                  <div className="text-base font-medium text-foreground">
                    {user?.name || 'User'}
                  </div>
                  <div className="text-sm font-medium text-muted-foreground">
                    {user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
              <div className="mt-3 space-y-1 px-2">
                {user?.role === 'ADMIN' && (
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleAdminClick();
                    }}
                    className="flex items-center w-full px-3 py-2 text-base font-medium text-foreground hover:text-primary hover:bg-background rounded-lg transition-colors"
                  >
                    <Icon icon={ShieldCheckIcon} size="sm" className="mr-2" />
                    Admin Panel
                  </button>
                )}
                <button
                  onClick={() => {
                    setIsMobileMenuOpen(false);
                    logout();
                  }}
                  className="flex items-center w-full px-3 py-2 text-base font-medium text-foreground hover:text-destructive hover:bg-background rounded-lg transition-colors"
                >
                  <Icon icon={SignOutIcon} size="sm" className="mr-2" />
                  Logout
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 