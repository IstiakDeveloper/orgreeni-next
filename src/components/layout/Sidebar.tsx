// src/components/layout/Sidebar.tsx
import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  Home, 
  Users, 
  ShoppingCart, 
  Package, 
  BarChart, 
  Settings, 
  LogOut 
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { cn } from '@/lib/utils';

const MENU_ITEMS = [
  { 
    label: 'Dashboard', 
    href: '/dashboard', 
    icon: Home 
  },
  { 
    label: 'Users', 
    href: '/users', 
    icon: Users 
  },
  { 
    label: 'Orders', 
    href: '/orders', 
    icon: ShoppingCart 
  },
  { 
    label: 'Products', 
    href: '/products', 
    icon: Package 
  },
  { 
    label: 'Analytics', 
    href: '/analytics', 
    icon: BarChart 
  },
  { 
    label: 'Settings', 
    href: '/settings', 
    icon: Settings 
  }
];

export function Sidebar() {
  const router = useRouter();
  const { user, logout } = useAuth();

  return (
    <div className="hidden border-r bg-muted/40 md:block w-64 h-screen fixed left-0 top-0">
      <div className="flex h-full max-h-screen flex-col gap-2">
        {/* Logo and Brand */}
        <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="text-lg">ChalDal Admin</span>
          </Link>
        </div>

        {/* User Profile */}
        <div className="flex items-center border-b p-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary text-white flex items-center justify-center">
              {user?.name?.[0].toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium">{user?.name}</p>
              <p className="text-xs text-muted-foreground">{user?.role}</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
          {MENU_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                router.pathname === item.href 
                  ? "bg-primary text-primary-foreground hover:bg-primary/90" 
                  : "text-muted-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Logout */}
        <div className="mt-auto border-t p-4">
          <button 
            onClick={logout}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}