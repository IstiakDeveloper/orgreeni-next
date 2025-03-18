"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import axios from "axios";
import Image from "next/image";

import AdminLayout from "@/components/layout/AdminLayout";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { PlusCircle, Edit, Trash2, Search, RefreshCw, ChevronLeft, ChevronRight, ImageOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// API বেস URL
const API_URL = 'http://127.0.0.1:8080';

interface Brand {
  id: number;
  name: string;
  slug: string;
  description?: string;
  logo?: string;  // Changed from logo_url to match your schema
  is_active: boolean;
  products_count?: number;
  created_at: string;
  updated_at: string;
}

interface BrandPagination {
  current_page: number;
  data: Brand[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

interface ApiResponse {
  success: boolean;
  data: {
    brands: BrandPagination;
  };
  message?: string;
}

const BrandsPage = () => {
  const router = useRouter();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [filteredBrands, setFilteredBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<{
    currentPage: number;
    lastPage: number;
    total: number;
  }>({
    currentPage: 1,
    lastPage: 1,
    total: 0
  });

  // পেজ লোড হওয়ার সাথে সাথে ব্র্যান্ড ফেচ করুন
  useEffect(() => {
    fetchBrands();
  }, []);

  // সার্চ টার্ম পরিবর্তন হলে ফিল্টারিং করুন
  useEffect(() => {
    if (brands.length > 0) {
      const filtered = brands.filter((brand) =>
        brand.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBrands(filtered);
    }
  }, [searchTerm, brands]);

  // টোকেন পাওয়ার ফাংশন
  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  };

  // ব্র্যান্ড ফেচ করার ফাংশন
  const fetchBrands = async (page = 1) => {
    setIsLoading(true);
    setApiError(null);
    
    try {
      const token = getToken();
      console.log("Using token:", token ? "Yes" : "No");
      
      if (!token) {
        console.warn("No authentication token found!");
        router.push('/admin/login');
        return;
      }

      const response = await axios.get(`${API_URL}/api/v1/admin/brands?page=${page}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log("API Response:", response.data);
      
      if (response.data.success) {
        // পেজিনেশন স্ট্রাকচার থেকে সঠিকভাবে ডাটা নিন
        const brandsData = response.data.data.brands.data || [];
        setBrands(brandsData);
        setFilteredBrands(brandsData);
        
        // পেজিনেশন তথ্য আপডেট করুন
        setPagination({
          currentPage: response.data.data.brands.current_page,
          lastPage: response.data.data.brands.last_page,
          total: response.data.data.brands.total
        });
      } else {
        setApiError(response.data.message || "Failed to load brands");
        toast.error(response.data.message || "Failed to load brands");
      }
    } catch (error: any) {
      console.error("Error fetching brands:", error);
      const errorMessage = error.response?.data?.message || "Failed to load brands";
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
        `${API_URL}/api/v1/admin/brands/${id}/status`, 
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
        setBrands((prevBrands) =>
          prevBrands.map((brand) =>
            brand.id === id ? { ...brand, is_active: !currentStatus } : brand
          )
        );
        toast.success("Brand status updated successfully");
      } else {
        toast.error(response.data.message || "Failed to update brand status");
      }
    } catch (error: any) {
      console.error("Error updating brand status:", error);
      toast.error(error.response?.data?.message || "Failed to update brand status");
      
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      }
    }
  };

  // ডিলিট ডায়ালগ খোলার ফাংশন
  const openDeleteDialog = (id: number) => {
    setSelectedBrandId(id);
    setShowDeleteDialog(true);
  };

  // ব্র্যান্ড ডিলিট করার ফাংশন
  const handleDelete = async () => {
    if (!selectedBrandId) return;

    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        router.push('/admin/login');
        return;
      }

      const response = await axios.delete(
        `${API_URL}/api/v1/admin/brands/${selectedBrandId}`,
        {
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      
      if (response.data.success) {
        setBrands((prevBrands) => 
          prevBrands.filter((brand) => brand.id !== selectedBrandId)
        );
        toast.success("Brand deleted successfully");
      } else {
        toast.error(response.data.message || "Failed to delete brand");
      }
    } catch (error: any) {
      console.error("Error deleting brand:", error);
      toast.error(error.response?.data?.message || "Failed to delete brand");
      
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      }
    } finally {
      setShowDeleteDialog(false);
      setSelectedBrandId(null);
    }
  };

  // পৃষ্ঠা পরিবর্তন করার ফাংশন
  const changePage = (page: number) => {
    if (page < 1 || page > pagination.lastPage) return;
    fetchBrands(page);
  };

  // রিফ্রেশ বাটন ক্লিক হ্যান্ডলার
  const handleRefresh = () => {
    fetchBrands(pagination.currentPage);
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
              <CardTitle>Brands Management</CardTitle>
              <CardDescription>Manage your product brands</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh
              </Button>
              <Button
                onClick={() => router.push("/admin/brands/create")}
                className="flex items-center gap-2"
              >
                <PlusCircle size={16} />
                Add New Brand
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <div className="flex justify-between items-center mb-6">
              <div className="relative w-64">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search brands..."
                  className="pl-8"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              {!isLoading && !apiError && pagination.total > 0 && (
                <div className="text-sm text-muted-foreground">
                  Showing {brands.length} of {pagination.total} brands
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
            ) : filteredBrands.length === 0 ? (
              <div className="flex flex-col justify-center items-center h-64">
                <p className="text-muted-foreground mb-4">No brands found</p>
                <Button onClick={() => router.push("/admin/brands/create")} className="flex items-center gap-2">
                  <PlusCircle size={16} />
                  Add New Brand
                </Button>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>Logo</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Slug</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Products</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBrands.map((brand) => (
                      <TableRow key={brand.id}>
                        <TableCell>{brand.id}</TableCell>
                        <TableCell>
                          {brand.logo ? (
                            <div className="relative h-10 w-10 overflow-hidden rounded-md">
                              <img
                                src={`${API_URL}/storage/${brand.logo}`}
                                alt={`${brand.name} logo`}
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
                        <TableCell className="font-medium">{brand.name}</TableCell>
                        <TableCell>{brand.slug}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Switch
                              checked={brand.is_active}
                              onCheckedChange={() => handleStatusChange(brand.id, brand.is_active)}
                            />
                            <Badge variant={brand.is_active ? "success" : "secondary"}>
                              {brand.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>{brand.products_count || 0}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/admin/brands/edit/${brand.id}`)}
                            >
                              <Edit size={16} />
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => openDeleteDialog(brand.id)}
                            >
                              <Trash2 size={16} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                
                {/* পেজিনেশন কন্ট্রোল */}
                {pagination.lastPage > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(pagination.currentPage - 1)}
                      disabled={pagination.currentPage <= 1}
                    >
                      <ChevronLeft size={16} />
                    </Button>
                    <div className="text-sm">
                      Page {pagination.currentPage} of {pagination.lastPage}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => changePage(pagination.currentPage + 1)}
                      disabled={pagination.currentPage >= pagination.lastPage}
                    >
                      <ChevronRight size={16} />
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Brand"
        description="Are you sure you want to delete this brand? This action cannot be undone."
      />
    </AdminLayout>
  );
};

export default BrandsPage;