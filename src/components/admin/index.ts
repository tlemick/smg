/**
 * Admin Components Index
 * Exports all admin-related components for easier importing
 */

export { default as AdminDashboard } from './AdminDashboard';
export { default as AdminNav } from './AdminNav';
export { default as UserManagement } from './UserManagement';
export { default as UserList } from './UserList';
export { default as UserCard } from './UserCard';
export { default as CreateUserForm } from './CreateUserForm';
export { default as UserEditModal } from './UserEditModal';
export { default as GameSessionManagement } from './GameSessionManagement';

// Re-export types for convenience
export type { AdminDashboardProps } from './AdminDashboard';
export type { AdminNavProps } from './AdminNav';
export type { UserManagementProps } from './UserManagement';
export type { UserListProps } from './UserList';
export type { UserCardProps } from './UserCard';
export type { CreateUserFormProps } from './CreateUserForm';
export type { UserEditModalProps } from './UserEditModal';
// Note: GameSessionManagementProps is not exported from GameSessionManagement.