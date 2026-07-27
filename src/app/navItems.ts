import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Receipt,
  Boxes,
  BarChart3,
  Settings,
  type LucideIcon,
} from 'lucide-react';
import type { Role } from '@/types/roles';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: Role[];
}

const ALL_ROLES: Role[] = ['admin', 'clinic_manager', 'dentist', 'hygienist', 'receptionist'];

export const NAV_ITEMS: NavItem[] = [
  { label: 'Dashboard', path: '/', icon: LayoutDashboard, roles: ALL_ROLES },
  { label: 'Patients', path: '/patients', icon: Users, roles: ALL_ROLES },
  { label: 'Schedule', path: '/schedule', icon: CalendarDays, roles: ALL_ROLES },
  { label: 'Billing', path: '/billing', icon: Receipt, roles: ['admin', 'clinic_manager', 'receptionist'] },
  { label: 'Inventory', path: '/inventory', icon: Boxes, roles: ['admin', 'clinic_manager'] },
  { label: 'Reports', path: '/reports', icon: BarChart3, roles: ['admin', 'clinic_manager'] },
  { label: 'Settings', path: '/settings', icon: Settings, roles: ['admin'] },
];
