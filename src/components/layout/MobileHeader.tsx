// src/components/layout/MobileHeader.tsx
import React, { useState } from 'react';
import { Menu, Search, User } from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

export function MobileHeader() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-white">
      <div className="container flex h-16 items-center space-x-4 sm:space-x-0">
        {/* Mobile Menu Toggle */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Open Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-64">
            <Sidebar />
          </SheetContent>
        </Sheet>

        {/* Page Title */}
        <div className="flex-1">
          <h1 className="text-xl font-bold truncate">Dashboard</h1>
        </div>

        {/* Search and User Actions */}
        <div className="flex items-center space-x-2">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
          >
            <Search className="h-5 w-5" />
            <span className="sr-only">Search</span>
          </Button>

          {/* User Profile */}
          <Button
            variant="outline"
            size="icon"
            className="rounded-full"
          >
            {user?.profile_photo ? (
              <img
                src={user.profile_photo}
                alt="Profile"
                className="rounded-full"
              />
            ) : (
              <User className="h-5 w-5" />
            )}
          </Button>
        </div>
      </div>

      {/* Mobile Search (Optional - can be a modal or bottom sheet) */}
      <div className="md:hidden container pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="search"
            placeholder="Search..."
            className="w-full pl-10 rounded-full"
          />
        </div>
      </div>
    </header>
  );
}