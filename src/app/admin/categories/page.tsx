"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";

import AdminLayout from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2, Search, RefreshCw, ChevronDown, ChevronUp, Layers, ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// API বেস URL
const API_URL = 'http://127.0.0.1:8080';

interface Category {
  id: number;
  name: string;
  name_bn: string;
  slug: string;
  description?: string;
  description_bn?: string;
  image?: string;
  parent_id?: number | null;
  parent?: Category;
  is_active: boolean;
  order: number;
  children_count: number;
  products_count: number;
  created_at: string;
  updated_at: string;
}

const CategoriesPage = () => {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [parentOnly, setParentOnly] = useState<boolean>(false);

  // পেজ লোড হওয়ার সাথে সাথে ক্যাটাগরি ফেচ করুন
  useEffect(() => {
    fetchCategories();
  }, [parentOnly]);

  // সার্চ টার্ম পরিবর্তন হলে ফিল্টারিং করুন
  useEffect(() => {
    if (categories.length > 0) {
      const filtered = categories.filter((category) =>
        category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        category.name_bn.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchTerm, categories]);

  // টোকেন পাওয়ার ফাংশন
  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  };

  // ক্যাটাগরি ফেচ করার ফাংশন
  const fetchCategories = async () => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const token = getToken();
      
      if (!token) {
        console.warn("No authentication token found!");
        router.push('/admin/login');
        return;
      }

      const url = `${API_URL}/api/v1/admin/categories${parentOnly ? '?parent_only=true' : ''}`;
      
      const response = await axios.get(url, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const categoriesData = response.data.data.categories || [];
        setCategories(categoriesData);
        setFilteredCategories(categoriesData);
      } else {
        setApiError(response.data.message || "Failed to load categories");
        toast.error(response.data.message || "Failed to load categories");
      }
    } catch (error: any) {
      console.error("Error fetching categories:", error);
      const errorMessage = error.response?.data?.message || "Failed to load categories";
      setApiError(errorMessage);
      toast.error(errorMessage);
      
      // Unauthorized হলে লগইন পেজে রিডাইরেক্ট করুন
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // স্ট্যাটাস পরিবর্তন করার ফাংশন
  const handleStatusChange = async (id: number, currentStatus: boolean) => {
    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        router.push('/admin/login');
        return;
      }

      const response = await axios.post(
        `${API_URL}/api/v1/admin/categories/${id}/status`, 
        { is_active: !currentStatus },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        setCategories((prevCategories) =>
          prevCategories.map((category) =>
            category.id === id ? { ...category, is_active: !currentStatus } : category
          )
        );
        toast.success("Category status updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update category status");
      }
    } catch (error: any) {
      console.error("Error updating category status:", error);
      toast.error(error.response?.data?.message || "Failed to update category status");
      
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      }
    }
  };

  // ডিলিট ডায়ালগ খোলার ফাংশন
  const openDeleteDialog = (id: number) => {
    setSelectedCategoryId(id);
    setShowDeleteDialog(true);
  };

  // ক্যাটাগরি ডিলিট করার ফাংশন
  const handleDelete = async () => {
    if (!selectedCategoryId) return;

    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        router.push('/admin/login');
        return;
      }

      const response = await axios.delete(
        `${API_URL}/api/v1/admin/categories/${selectedCategoryId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setCategories((prevCategories) => 
          prevCategories.filter((category) => category.id !== selectedCategoryId)
        );
        toast.success("Category deleted successfully");
      } else {
        toast.error(response.data.message || "Failed to delete category");
      }
    } catch (error: any) {
      console.error("Error deleting category:", error);
      toast.error(error.response?.data?.message || "Failed to delete category");
      
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      }
    } finally {
      setShowDeleteDialog(false);
      setSelectedCategoryId(null);
    }
  };

  // রিফ্রেশ বাটন ক্লিক হ্যান্ডলার
  const handleRefresh = () => {
    fetchCategories();
  };

  // ফিল্টার টগল হ্যান্ডলার
  const toggleParentOnlyFilter = () => {
    setParentOnly(!parentOnly);
  };

  // ক্যাটাগরি অর্ডার আপডেট ফাংশন
  const handleOrderChange = async (id: number, direction: 'up' | 'down') => {
    // Find the current category and its current order
    const currentCategory = categories.find(cat => cat.id === id);
    if (!currentCategory) return;
    
    // Find the category to swap with
    const otherCategories = categories.filter(cat => 
      cat.parent_id === currentCategory.parent_id // Same parent level
    );
    
    otherCategories.sort((a, b) => a.order - b.order);
    
    let targetCategory;
    if (direction === 'up') {
      // Find the category with the closest lower order
      targetCategory = [...otherCategories].reverse().find(cat => cat.order < currentCategory.order);
    } else {
      // Find the category with the closest higher order
      targetCategory = otherCategories.find(cat => cat.order > currentCategory.order);
    }
    
    if (!targetCategory) {
      toast.info("Cannot move this category further in that direction");
      return;
    }
    
    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        router.push('/admin/login');
        return;
      }
      
      // Swap the orders
      const response = await axios.post(
        `${API_URL}/api/v1/admin/categories/update-order`,
        {
          categories: [
            { id: currentCategory.id, order: targetCategory.order },
            { id: targetCategory.id, order: currentCategory.order }
          ]
        },
        {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        // Update the local state to reflect the change
        setCategories(prevCategories => {
          return prevCategories.map(cat => {
            if (cat.id === currentCategory.id) {
              return { ...cat, order: targetCategory.order };
            }
            if (cat.id === targetCategory.id) {
              return { ...cat, order: currentCategory.order };
            }
            return cat;
          });
        });
        
        toast.success("Category order updated");
      } else {
        toast.error(response.data.message || "Failed to update category order");
      }
    } catch (error: any) {
      console.error("Error updating category order:", error);
      toast.error(error.response?.data?.message || "Failed to update category order");
    }
  };

  // Get parent category name for nested categories
  const getParentName = (category: Category) => {
    if (!category.parent_id) return null;
    const parent = categories.find(c => c.id === category.parent_id);
    return parent ? parent.name : null;
  };

  // ইমেজ লোড না হলে ফলব্যাক ইমেজ দেখানোর ফাংশন
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    e.currentTarget.src = '/placeholder-image.jpg'; // আপনার ফলব্যাক ইমেজ পাথ
  };

  return (
    <AdminLayout>
      <div className="container mx-auto px-4 py-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Categories Management</CardTitle>
              <CardDescription>Manage your product categories</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={toggleParentOnlyFilter}
                className="flex items-center gap-2"
              >
                <Layers size={16} />
                {parentOnly ? "Show All Categories" : "Show Parent Categories Only"}
              </Button>
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
              <Button
                onClick={() => router.push("/admin/categories/create")}
                className="flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add New Category
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search categories..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {!isLoading && !apiError && (
                <div className="text-sm text-muted-foreground">
                  {filteredCategories.length} categories found
                </div>
              )}
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <LoadingSpinner />
              </div>
            ) : apiError ? (
              <div className="flex flex-col justify-center items-center h-64">
                <p className="text-red-500 mb-4">{apiError}</p>
                <Button onClick={handleRefresh}>Try Again</Button>
              </div>
            ) : filteredCategories.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64">
                <p className="text-muted-foreground mb-4">No categories found</p>
                <Button onClick={() => router.push("/admin/categories/create")} className="flex items-center gap-2">
                  <PlusCircle size={16} />
                  Add New Category
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Image</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Bangla Name</TableHead>
                    {!parentOnly && <TableHead>Parent</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Children</TableHead>
                    <TableHead>Products</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCategories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        {category.image ? (
                          <div className="relative h-10 w-10 overflow-hidden rounded-md">
                            <img
                              src={`${API_URL}/storage/${category.image}`}
                              alt={`${category.name} image`}
                              className="h-full w-full object-contain"
                              onError={handleImageError}
                            />
                          </div>
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                            <ImageOff size={16} className="text-gray-400" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{category.name}</TableCell>
                      <TableCell>{category.name_bn}</TableCell>
                      {!parentOnly && (
                        <TableCell>
                          {getParentName(category) || (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      )}
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={category.is_active}
                            onCheckedChange={() => handleStatusChange(category.id, category.is_active)}
                          />
                          <Badge variant={category.is_active ? "success" : "secondary"}>
                            {category.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <span>{category.order}</span>
                          <div className="flex flex-col">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleOrderChange(category.id, 'up')}
                            >
                              <ChevronUp size={14} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleOrderChange(category.id, 'down')}
                            >
                              <ChevronDown size={14} />
                            </Button>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{category.children_count}</TableCell>
                      <TableCell>{category.products_count}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => router.push(`/admin/categories/edit/${category.id}`)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => openDeleteDialog(category.id)}
                            disabled={category.children_count > 0 || category.products_count > 0}
                            title={
                              category.children_count > 0
                                ? "Cannot delete category with subcategories"
                                : category.products_count > 0
                                ? "Cannot delete category with products"
                                : "Delete category"
                            }
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Category"
        description="Are you sure you want to delete this category? This action cannot be undone."
      />
    </AdminLayout>
  );
};

export default CategoriesPage;