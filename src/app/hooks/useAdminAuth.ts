"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';

interface User {
  id: number;
  name: string;
  email?: string;
  phone: string;
  role: string;
}

interface AuthHook {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

export default function useAdminAuth(): AuthHook {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const router = useRouter();
  const pathname = usePathname();

  // Check authentication status on mount or path change
  useEffect(() => {
    const checkAuth = async () => {
      setIsLoading(true);
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        setUser(null);
        setIsLoading(false);
        
        // If on admin page but not login, redirect
        if (pathname?.startsWith('/admin') && 
            !pathname?.startsWith('/admin/login')) {
          router.push('/admin/login');
        }
        return;
      }
      
      // Token exists, try to fetch user data
      try {
        const response = await axios.get('/api/v1/admin/user', {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          setUser(response.data.data.user);
        } else {
          handleAuthFailure();
        }
      } catch (error) {
        console.error('Auth check failed:', error);
        handleAuthFailure();
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuth();
  }, [pathname, router]);
  
  // Handle authentication failure
  const handleAuthFailure = () => {
    // Clear stored auth data
    localStorage.removeItem('admin_token');
    localStorage.removeItem('admin_user');
    document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    setUser(null);
    
    // Redirect if on protected page
    if (pathname?.startsWith('/admin') && 
        !pathname?.startsWith('/admin/login')) {
      router.push('/admin/login');
      toast.error('Authentication failed. Please log in again.');
    }
  };
  
  // Login function
  const login = async (phone: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post('/api/v1/admin/login', { phone, password });
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // Save token in multiple places to ensure it's available
        localStorage.setItem('admin_token', token);
        document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        
        // Save user data
        setUser(user);
        localStorage.setItem('admin_user', JSON.stringify(user));
        
        toast.success('Login successful!');
        return true;
      } 
      return false;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.message || 'Login failed');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Logout function
  const logout = async (): Promise<void> => {
    setIsLoading(true);
    const token = localStorage.getItem('admin_token');
    
    try {
      if (token) {
        await axios.post('/api/v1/admin/logout', {}, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth data regardless of API response
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setUser(null);
      setIsLoading(false);
      router.push('/admin/login');
      toast.success('Logged out successfully');
    }
  };
  
  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout
  };
}