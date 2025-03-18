"use client";

import { useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Settings,
  LogOut,
  Menu,
  ChevronDown,
  ChevronRight,
  Boxes,
  Bell,
  Home,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AdminAuthContext";

interface NavigationItem {
  name: string;
  href?: string;
  icon: React.ElementType;
  current: boolean;
  submenu?: { name: string; href: string }[];
}

interface SidebarProps {
  isMobile: boolean;
  closeMobileMenu?: () => void;
}

interface AdminLayoutProps {
  children: ReactNode;
}

const Sidebar: React.FC<SidebarProps> = ({ isMobile, closeMobileMenu }) => {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();
  const [openSubMenu, setOpenSubMenu] = useState<string | null>(null);

  // Check which submenu should be opened based on current path
  useEffect(() => {
    if (pathname?.startsWith('/admin/products') || 
        pathname?.startsWith('/admin/categories') || 
        pathname?.startsWith('/admin/brands')) {
      setOpenSubMenu('Products');
    } else if (pathname?.startsWith('/admin/users')) {
      setOpenSubMenu('Users');
    } else if (pathname?.startsWith('/admin/reports')) {
      setOpenSubMenu('Reports');
    }
  }, [pathname]);

  const navigation: NavigationItem[] = [
    {
      name: "Dashboard",
      href: "/admin/dashboard",
      icon: LayoutDashboard,
      current: pathname === "/admin/dashboard",
    },
    {
      name: "Orders",
      href: "/admin/orders",
      icon: ShoppingCart,
      current: pathname?.startsWith("/admin/orders") || false,
    },
    {
      name: "Products",
      icon: Package,
      current: pathname?.startsWith("/admin/products") || pathname?.startsWith("/admin/categories") || pathname?.startsWith("/admin/brands") || false,
      submenu: [
        { name: "All Products", href: "/admin/products" },
        { name: "Add New", href: "/admin/products/create" },
        { name: "Categories", href: "/admin/categories" },
        { name: "Brands", href: "/admin/brands" },
      ],
    },
    {
      name: "Inventory",
      href: "/admin/inventory",
      icon: Boxes,
      current: pathname?.startsWith("/admin/inventory") || false,
    },
    {
      name: "Users",
      icon: Users,
      current: pathname?.startsWith("/admin/users") || false,
      submenu: [
        { name: "All Users", href: "/admin/users" },
        { name: "Customers", href: "/admin/users/customers" },
        { name: "Delivery Persons", href: "/admin/users/delivery" },
        { name: "Admins", href: "/admin/users/admins" },
      ],
    },
    {
      name: "Settings",
      href: "/admin/settings",
      icon: Settings,
      current: pathname?.startsWith("/admin/settings") || false,
    },
  ];

  const toggleSubMenu = (name: string) => {
    if (openSubMenu === name) {
      setOpenSubMenu(null);
    } else {
      setOpenSubMenu(name);
    }
  };

  const handleNavigate = (href: string) => {
    router.push(href);
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
  };

  const handleLogout = async () => {
    if (isMobile && closeMobileMenu) {
      closeMobileMenu();
    }
    await logout();
  };

  return (
    <div className="h-full bg-white border-r flex flex-col">
      <div className="px-4 py-6">
        <Link 
          href="/admin/dashboard" 
          className="flex items-center justify-center mb-8"
          onClick={() => isMobile && closeMobileMenu && closeMobileMenu()}
        >
          <span className="font-bold text-xl">Admin Dashboard</span>
        </Link>
        
        <nav className="space-y-1">
          {navigation.map((item) => (
            <div key={item.name}>
              {item.submenu ? (
                <div>
                  <button
                    onClick={() => toggleSubMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-sm font-medium rounded-md ${
                      item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center">
                      <item.icon className="mr-3 h-5 w-5 text-gray-500" />
                      {item.name}
                    </div>
                    {openSubMenu === item.name ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </button>
                  
                  {openSubMenu === item.name && (
                    <div className="mt-1 pl-8 space-y-1">
                      {item.submenu.map((subItem) => (
                        <button
                          key={subItem.name}
                          onClick={() => handleNavigate(subItem.href)}
                          className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                            pathname === subItem.href
                              ? 'bg-gray-100 text-gray-900'
                              : 'text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {subItem.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => item.href && handleNavigate(item.href)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                    item.current ? 'bg-gray-100 text-gray-900' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <item.icon className="mr-3 h-5 w-5 text-gray-500" />
                  {item.name}
                </button>
              )}
            </div>
          ))}
        </nav>
      </div>
      
      <div className="mt-auto p-4 space-y-4 border-t">
        <Link 
          href="/"
          className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          target="_blank"
        >
          <Home className="mr-2 h-4 w-4" />
          Visit Store
        </Link>
        
        <Button 
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={handleLogout}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </Button>
      </div>
    </div>
  );
};

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // Redirect if on login page or not authenticated
  useEffect(() => {
    if (!isLoading) {
      // If on login page, no need for this layout
      if (pathname?.includes('/admin/login')) {
        return;
      }
      
      // If not authenticated, redirect to login
      if (!isAuthenticated) {
        router.push('/admin/login');
      }
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  // If still loading or not authenticated, show loading
  if (isLoading || (!isAuthenticated && !pathname?.includes('/admin/login'))) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If on login page, don't use this layout
  if (pathname?.includes('/admin/login')) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <Sidebar isMobile={false} />
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-white shadow">
          <div className="flex-1 px-4 flex justify-between">
            <div className="flex-1 flex items-center">
              {/* Mobile menu button - ensure it's in a Sheet component */}
              <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" size="icon" className="md:hidden mr-4">
                    <Menu className="h-5 w-5" />
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="p-0">
                  <Sidebar 
                    isMobile={true} 
                    closeMobileMenu={() => setIsMobileMenuOpen(false)} 
                  />
                </SheetContent>
              </Sheet>
              
              <div className="ml-2">
                {/* Page title could go here if needed */}
              </div>
            </div>
            
            <div className="ml-4 flex items-center md:ml-6 space-x-4">
              {/* Notifications button */}
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </Button>
              
              {/* User dropdown */}
              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative rounded-full flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {user.profile_photo ? (
                          <AvatarImage src={user.profile_photo} alt={user.name} />
                        ) : (
                          <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <span className="hidden md:inline-block text-sm font-medium">
                        {user.name}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>My Account</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem disabled className="flex flex-col items-start">
                      <span className="font-semibold">{user.name}</span>
                      <span className="text-xs text-muted-foreground">{user.phone}</span>
                      {user.email && <span className="text-xs text-muted-foreground">{user.email}</span>}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/admin/profile')}>
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => router.push('/admin/settings')}>
                      Settings
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => logout()} className="text-red-600">
                      <LogOut className="mr-2 h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </div>

        <main className="flex-1 pb-8 overflow-y-auto">
          <div className="py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;