"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Users,
  Package,
  Truck,
  TrendingUp,
  Calendar,
  DollarSign,
} from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useAuth } from "@/contexts/AdminAuthContext";
import axiosInstance from "@/lib/axios";

interface DashboardStats {
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  totalRevenue: number;
  pendingOrders: number;
  completedOrders: number;
  lowStockItems: number;
}

export default function AdminDashboard() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch dashboard stats
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchStats();
    }
  }, [authLoading, isAuthenticated]);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      // In a production app, fetch from your API
      // const { data } = await axiosInstance.get('/api/v1/admin/dashboard/stats');
      
      // Using mockup data for development
      setTimeout(() => {
        setStats({
          totalOrders: 156,
          totalCustomers: 1243,
          totalProducts: 567,
          totalRevenue: 24680,
          pendingOrders: 23,
          completedOrders: 133,
          lowStockItems: 12,
        });
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      setIsLoading(false);
    }
  };

  // If auth is still loading, show loading indicator
  if (authLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Welcome, {user?.name || "Admin"}!</h1>
          <p className="text-muted-foreground">
            Here's what's happening with your store today.
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                <ShoppingCart className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalOrders}</div>
                <p className="text-xs text-muted-foreground">
                  +10% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalCustomers}</div>
                <p className="text-xs text-muted-foreground">
                  +5.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Products</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.totalProducts}</div>
                <p className="text-xs text-muted-foreground">
                  +12 new this month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  ৳{stats?.totalRevenue?.toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground">
                  +18.2% from last month
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.pendingOrders}</div>
                <Button 
                  variant="link" 
                  className="px-0 py-0 h-auto text-xs"
                  onClick={() => router.push('/admin/orders?status=pending')}
                >
                  View pending orders
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Completed Orders</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.completedOrders}</div>
                <p className="text-xs text-muted-foreground">
                  Last 30 days
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats?.lowStockItems}</div>
                <Button 
                  variant="link" 
                  className="px-0 py-0 h-auto text-xs"
                  onClick={() => router.push('/admin/inventory/low-stock')}
                >
                  View low stock items
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/products/create')}
                >
                  <Package className="mr-2 h-4 w-4" />
                  Add New Product
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start"
                  onClick={() => router.push('/admin/orders')}
                >
                  <ShoppingCart className="mr-2 h-4 w-4" />
                  Manage Orders
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}