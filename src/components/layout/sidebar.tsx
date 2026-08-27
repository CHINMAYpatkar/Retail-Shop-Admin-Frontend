'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Boxes,
  Tags,
  ShoppingCart,
  Star,
  Users,
  ShieldCheck,
  UserCog,
  ChefHat,
  Image as ImageIcon,
  FileText,
  Newspaper,
  HelpCircle,
  FolderOpen,
  LifeBuoy,
  Settings as SettingsIcon,
  Leaf,
  Truck,
  Package,
  Receipt,
  Banknote,
  TrendingUp,
  Wallet,
  Undo2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/auth-store';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  roles?: Array<'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'STAFF'>;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Overview',
    items: [{ label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard }],
  },
  {
    label: 'Catalog',
    items: [
      { label: 'Products', href: '/products', icon: Boxes, permission: 'products.view' },
      { label: 'Categories', href: '/categories', icon: Tags, permission: 'categories.view' },
      { label: 'Ingredients', href: '/ingredients', icon: Leaf, permission: 'ingredients.view' },
      { label: 'Recipes', href: '/recipes', icon: ChefHat, permission: 'recipes.view' },
    ],
  },
  {
    label: 'Sales',
    items: [
      { label: 'Orders', href: '/orders', icon: ShoppingCart, permission: 'orders.view' },
      { label: 'Reviews', href: '/reviews', icon: Star, permission: 'reviews.view' },
      { label: 'Customers', href: '/customers', icon: Users, permission: 'customers.view' },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Banners', href: '/banners', icon: ImageIcon, permission: 'banners.view' },
      { label: 'CMS Pages', href: '/cms-pages', icon: FileText, permission: 'cms.view' },
      { label: 'Blogs', href: '/blogs', icon: Newspaper, permission: 'blogs.view' },
      { label: 'FAQs', href: '/faqs', icon: HelpCircle, permission: 'faqs.view' },
      { label: 'Media Library', href: '/media', icon: FolderOpen },
    ],
  },
  {
    // Back office. Role-restricted rather than permission-gated: supplier
    // pricing and margins are not MANAGER or STAFF information, so the whole
    // group is hidden for those roles.
    label: 'Operations',
    items: [
      { label: 'Vendors', href: '/vendors', icon: Truck, roles: ['SUPER_ADMIN', 'ADMIN'] },
      {
        label: 'Raw Materials',
        href: '/raw-materials',
        icon: Package,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Purchase Bills',
        href: '/purchase-bills',
        icon: Receipt,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Vendor Payments',
        href: '/vendor-payments',
        icon: Banknote,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      {
        label: 'Margins',
        href: '/margins',
        icon: TrendingUp,
        roles: ['SUPER_ADMIN', 'ADMIN'],
      },
      { label: 'Expenses', href: '/expenses', icon: Wallet, roles: ['SUPER_ADMIN', 'ADMIN'] },
      { label: 'Refunds', href: '/refunds', icon: Undo2, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
  {
    label: 'Support',
    items: [{ label: 'Tickets', href: '/support', icon: LifeBuoy }],
  },
  {
    label: 'System',
    items: [
      { label: 'Admin Users', href: '/admin-users', icon: UserCog, permission: 'users.view' },
      { label: 'Roles', href: '/roles', icon: ShieldCheck, permission: 'roles.view' },
      { label: 'Settings', href: '/settings', icon: SettingsIcon, roles: ['SUPER_ADMIN', 'ADMIN'] },
    ],
  },
];

export function Sidebar() {
  const pathname = usePathname();
  const hasPermission = useAuthStore((s) => s.hasPermission);
  const admin = useAuthStore((s) => s.admin);

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-ink-900 text-paper-100">
      <div className="flex h-16 items-center gap-2.5 px-5">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gold-600 text-xs font-bold text-ink-950">
          RS
        </span>
        <div className="leading-tight">
          <p className="font-display text-sm font-semibold text-white">Retail Shop</p>
          <p className="text-[11px] text-ink-400">Admin Console</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
        {NAV_GROUPS.map((group) => {
          const items = group.items.filter((item) => {
            const permissionOk = !item.permission || hasPermission(item.permission);
            const roleOk = !item.roles || (admin ? item.roles.includes(admin.roleName) : false);
            return permissionOk && roleOk;
          });
          if (items.length === 0) return null;

          return (
            <div key={group.label} className="mb-5">
              <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-wider text-ink-400">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {items.map((item) => {
                  const active = pathname === item.href || pathname?.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn(
                        'relative flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors',
                        active ? 'text-white' : 'text-ink-300 hover:bg-ink-800 hover:text-white',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="nav-indicator"
                          className="absolute left-0 top-1/2 h-4 w-[3px] -translate-y-1/2 rounded-full bg-gold-500"
                          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                        />
                      )}
                      <item.icon className={cn('h-4 w-4', active ? 'text-gold-500' : 'text-ink-400')} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-ink-800 px-4 py-3">
        <p className="truncate text-xs text-ink-400">{admin?.email}</p>
        <p className="text-[11px] text-ink-500">{admin?.roleName.replace('_', ' ')}</p>
      </div>
    </aside>
  );
}
