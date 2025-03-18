"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import axiosInstance from "@/lib/axios";
import { toast } from "react-hot-toast";

interface User {
  id: number;
  name: string;
  email?: string | null;
  phone: string;
  role: string;
  profile_photo?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { phone: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Configure axios interceptors for auth
  useEffect(() => {
    // Add request interceptor
    const requestInterceptor = axiosInstance.interceptors.request.use(
      (config) => {
        // Add token to requests if available
        const token = localStorage.getItem("admin_token");
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptor
    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        // Handle 401 errors (unauthorized)
        if (error.response?.status === 401) {
          // Clear auth data
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
          setUser(null);
          
          // Only redirect if not already on login page
          if (pathname && !pathname.includes("/admin/login")) {
            router.push("/admin/login");
          }
        }
        return Promise.reject(error);
      }
    );

    // Clean up interceptors
    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, [pathname, router]);

  // Initialize auth state
  useEffect(() => {
    const initAuth = async () => {
      setIsLoading(true);
      
      // Check login status
      const token = localStorage.getItem("admin_token");
      const storedUser = localStorage.getItem("admin_user");
      
      if (!token) {
        setIsLoading(false);
        // If on admin page but not login, redirect
        if (pathname?.startsWith("/admin") && !pathname?.includes("/admin/login")) {
          router.push("/admin/login");
        }
        return;
      }
      
      // If we have stored user data, use it initially
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (e) {
          console.error("Error parsing stored user data");
        }
      }
      
      // Verify token with the server
      try {
        const { data } = await axiosInstance.get("/api/v1/admin/user", {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (data.success) {
          setUser(data.data.user);
          localStorage.setItem("admin_user", JSON.stringify(data.data.user));
        } else {
          handleAuthFailure();
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
        handleAuthFailure();
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname, router]);

  const handleAuthFailure = () => {
    // Clear auth data
    localStorage.removeItem("admin_token");
    localStorage.removeItem("admin_user");
    setUser(null);
    
    // Redirect if on protected page
    if (pathname?.startsWith("/admin") && !pathname?.includes("/admin/login")) {
      router.push("/admin/login");
    }
  };

  const login = async (credentials: { phone: string; password: string }): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.post("/api/v1/admin/login", credentials);
      
      if (data.success) {
        const { token, user } = data.data;
        
        // Save auth data
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_user", JSON.stringify(user));
        
        // Set cookie for middleware
        document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        
        // Update state
        setUser(user);
        
        // Success message
        toast.success("Login successful");
        return true;
      } else {
        toast.error(data.message || "Login failed");
        return false;
      }
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    setIsLoading(true);
    const token = localStorage.getItem("admin_token");
    
    try {
      if (token) {
        await axiosInstance.post("/api/v1/admin/logout", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Always clean up auth data regardless of API success
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      setUser(null);
      setIsLoading(false);
      
      // Redirect to login
      router.push("/admin/login");
      toast.success("You have been logged out");
    }
  };

  const refreshUser = async (): Promise<void> => {
    const token = localStorage.getItem("admin_token");
    if (!token) return;
    
    try {
      const { data } = await axiosInstance.get("/api/v1/admin/user", {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (data.success) {
        setUser(data.data.user);
        localStorage.setItem("admin_user", JSON.stringify(data.data.user));
      }
    } catch (error) {
      console.error("Error refreshing user data:", error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};