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
import {
    PlusCircle,
    Edit,
    Trash2,
    Search,
    RefreshCw,
    Filter,
    ImageOff,
    Package,
    Tag,
    MoreHorizontal
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import {
    Select,
    SelectContent,
    SelectGroup,
    SelectItem,
    SelectLabel,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// API বেস URL
const API_URL = 'http://127.0.0.1:8080';

// Product স্ট্যাটাস: active, inactive, draft
const STATUS_COLORS = {
    active: "success",
    inactive: "secondary",
    draft: "warning"
};

interface Product {
    id: number;
    name: string;
    name_bn?: string;
    slug: string;
    description?: string;
    description_bn?: string;
    category_id: number;
    category?: {
        id: number;
        name: string;
    };
    brand_id?: number;
    brand?: {
        id: number;
        name: string;
    };
    unit_id?: number;
    unit?: {
        id: number;
        name: string;
    };
    images: ProductImage[];
    sku: string;
    barcode?: string;
    base_price: number;
    sale_price: number;
    discount_percentage?: number;
    weight?: number;
    is_vat_applicable: boolean;
    vat_percentage?: number;
    is_featured: boolean;
    is_popular: boolean;
    stock_alert_quantity?: number;
    status: 'active' | 'inactive' | 'draft';
    current_stock: number;
    created_at: string;
    updated_at: string;
}

interface ProductImage {
    id: number;
    product_id: number;
    image: string;
    is_primary: boolean;
}

interface Category {
    id: number;
    name: string;
}

interface Brand {
    id: number;
    name: string;
}

interface Pagination {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

const ProductsPage = () => {
    const router = useRouter();
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [showDeleteDialog, setShowDeleteDialog] = useState<boolean>(false);
    const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
    const [apiError, setApiError] = useState<string | null>(null);

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [categoryFilter, setCategoryFilter] = useState<string>("all");
    const [brandFilter, setBrandFilter] = useState<string>("all");



    // Pagination
    const [pagination, setPagination] = useState<Pagination>({
        current_page: 1,
        last_page: 1,
        per_page: 15,
        total: 0
    });

    // পেজ লোড হওয়ার সাথে সাথে ডাটা ফেচ করুন
    useEffect(() => {
        fetchDropdownData();
        fetchProducts();
    }, []);

    // ফিল্টার পরিবর্তন হলে ডাটা রিলোড করুন
    useEffect(() => {
        fetchProducts();
    }, [statusFilter, categoryFilter, brandFilter, pagination.current_page, pagination.per_page]);

    // টোকেন পাওয়ার ফাংশন
    const getToken = (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('admin_token');
        }
        return null;
    };

    // ড্রপডাউন ডাটা ফেচ করার ফাংশন
    const fetchDropdownData = async () => {
        try {
            const token = getToken();

            if (!token) {
                console.warn("No authentication token found!");
                router.push('/admin/login');
                return;
            }

            // Fetch categories
            const categoriesResponse = await axios.get(`${API_URL}/api/v1/admin/categories?parent_only=true`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            // Fetch brands
            const brandsResponse = await axios.get(`${API_URL}/api/v1/admin/brands`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (categoriesResponse.data.success) {
                setCategories(categoriesResponse.data.data.categories || []);
            }

            if (brandsResponse.data.success) {
                setBrands(brandsResponse.data.data.brands.data || []);
            }
        } catch (error) {
            console.error("Error fetching dropdown data:", error);
            toast.error("Failed to load dropdown data for filters");
        }
    };

    // Product ফেচ করার ফাংশন
    const fetchProducts = async () => {
        setIsLoading(true);
        setApiError(null);

        try {
            const token = getToken();

            if (!token) {
                console.warn("No authentication token found!");
                router.push('/admin/login');
                return;
            }

            // Build query parameters
            const params = new URLSearchParams();
            if (searchTerm) params.append('search', searchTerm);
            if (statusFilter && statusFilter !== "all") params.append('status', statusFilter);
            if (categoryFilter && categoryFilter !== "all") params.append('category_id', categoryFilter);
            if (brandFilter && brandFilter !== "all") params.append('brand_id', brandFilter);
            params.append('per_page', pagination.per_page.toString());
            params.append('page', pagination.current_page.toString());

            // Make the API request - similar to how we fetched dropdown data
            const response = await axios.get(`${API_URL}/api/v1/admin/products?${params.toString()}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            console.log("Products API Response:", response.data); // Debug log

            if (response.data.success) {
                // Adjust this line according to your API response structure
                const productsData = response.data.data.products?.data || [];
                setProducts(productsData);

                // Set pagination data - adjust according to your API response
                if (response.data.data.products) {
                    setPagination({
                        current_page: response.data.data.products.current_page || 1,
                        last_page: response.data.data.products.last_page || 1,
                        per_page: response.data.data.products.per_page || 15,
                        total: response.data.data.products.total || 0
                    });
                }
            } else {
                setApiError(response.data.message || "Failed to load products");
                toast.error(response.data.message || "Failed to load products");
            }
        } catch (error: any) {
            console.error("Error fetching products:", error);
            console.log("Error response data:", error.response?.data); // Log full error data

            const errorMessage = error.response?.data?.message || "Failed to load products";
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

    // সার্চ হ্যান্ডলার
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Reset pagination to first page
        setPagination(prev => ({ ...prev, current_page: 1 }));
        fetchProducts();
    };

    // স্ট্যাটাস পরিবর্তন করার ফাংশন
    const handleStatusChange = async (id: number, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';

        try {
            const token = getToken();

            if (!token) {
                toast.error("Authentication required");
                router.push('/admin/login');
                return;
            }

            const response = await axios.post(
                `${API_URL}/api/v1/admin/products/${id}/status`,
                { status: newStatus },
                {
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setProducts((prevProducts) =>
                    prevProducts.map((product) =>
                        product.id === id ? { ...product, status: newStatus as 'active' | 'inactive' | 'draft' } : product
                    )
                );
                toast.success("Product status updated successfully");
            } else {
                toast.error(response.data.message || "Failed to update product status");
            }
        } catch (error: any) {
            console.error("Error updating product status:", error);
            toast.error(error.response?.data?.message || "Failed to update product status");

            if (error.response?.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
            }
        }
    };

    // ডিলিট ডায়ালগ খোলার ফাংশন
    const openDeleteDialog = (id: number) => {
        setSelectedProductId(id);
        setShowDeleteDialog(true);
    };

    // Product ডিলিট করার ফাংশন
    const handleDelete = async () => {
        if (!selectedProductId) return;

        try {
            const token = getToken();

            if (!token) {
                toast.error("Authentication required");
                router.push('/admin/login');
                return;
            }

            const response = await axios.delete(
                `${API_URL}/api/v1/admin/products/${selectedProductId}`,
                {
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    }
                }
            );

            if (response.data.success) {
                setProducts((prevProducts) =>
                    prevProducts.filter((product) => product.id !== selectedProductId)
                );
                toast.success("Product deleted successfully");
            } else {
                toast.error(response.data.message || "Failed to delete product");
            }
        } catch (error: any) {
            console.error("Error deleting product:", error);
            toast.error(error.response?.data?.message || "Failed to delete product");

            if (error.response?.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
            }
        } finally {
            setShowDeleteDialog(false);
            setSelectedProductId(null);
        }
    };

    // পৃষ্ঠা পরিবর্তন করার ফাংশন
    const changePage = (page: number) => {
        if (page < 1 || page > pagination.last_page) return;
        setPagination(prev => ({ ...prev, current_page: page }));
    };

    // পার পেজ আইটেম পরিবর্তন করার ফাংশন
    const handlePerPageChange = (value: string) => {
        setPagination(prev => ({
            ...prev,
            per_page: parseInt(value),
            current_page: 1
        }));
    };

    // Clear all filters
    const clearFilters = () => {
        setSearchTerm("");
        setStatusFilter("");
        setCategoryFilter("");
        setBrandFilter("");
        setPagination(prev => ({ ...prev, current_page: 1 }));
    };

    // ইমেজ লোড না হলে ফলব্যাক ইমেজ দেখানোর ফাংশন
    const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
        e.currentTarget.src = '/placeholder-product.jpg'; // আপনার ফলব্যাক ইমেজ পাথ
    };

    // Get the primary image of a product
    const getPrimaryImage = (product: Product) => {
        const primaryImage = product.images?.find(img => img.is_primary);
        return primaryImage ? `${API_URL}/storage/${primaryImage.image}` : null;
    };

    // Format price with locale
    const formatPrice = (price: number) => {
        return price.toLocaleString('bn-BD', { style: 'currency', currency: 'BDT' });
    };

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Products Management</CardTitle>
                            <CardDescription>Manage your store products</CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => fetchProducts()}
                                className="flex items-center gap-2"
                            >
                                <RefreshCw size={16} />
                                Refresh
                            </Button>
                            <Button
                                onClick={() => router.push("/admin/products/create")}
                                className="flex items-center gap-2"
                            >
                                <PlusCircle size={16} />
                                Add New Product
                            </Button>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <div className="mb-6 space-y-4">
                            {/* Search form */}
                            <form onSubmit={handleSearch} className="flex gap-2">
                                <div className="relative flex-1">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search products by name, SKU or barcode..."
                                        className="pl-8"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                                <Button type="submit">Search</Button>
                                <Button type="button" variant="outline" onClick={clearFilters}>
                                    Clear
                                </Button>
                            </form>

                            {/* Filters */}
                            <div className="flex flex-wrap gap-4">
                                <div className="w-full md:w-auto">
                                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Status filter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Statuses</SelectItem>
                                            <SelectItem value="active">Active</SelectItem>
                                            <SelectItem value="inactive">Inactive</SelectItem>
                                            <SelectItem value="draft">Draft</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full md:w-auto">
                                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Category filter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Categories</SelectItem>
                                            {categories.map((category) => (
                                                <SelectItem key={category.id} value={category.id.toString()}>
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="w-full md:w-auto">
                                    <Select value={brandFilter} onValueChange={setBrandFilter}>
                                        <SelectTrigger className="w-full md:w-[180px]">
                                            <SelectValue placeholder="Brand filter" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Brands</SelectItem>
                                            {brands.map((brand) => (
                                                <SelectItem key={brand.id} value={brand.id.toString()}>
                                                    {brand.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="ml-auto flex items-center gap-2">
                                    <Select
                                        value={pagination.per_page.toString()}
                                        onValueChange={handlePerPageChange}
                                    >
                                        <SelectTrigger className="w-[100px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="15">15 per page</SelectItem>
                                            <SelectItem value="30">30 per page</SelectItem>
                                            <SelectItem value="50">50 per page</SelectItem>
                                            <SelectItem value="100">100 per page</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    {!isLoading && !apiError && (
                                        <div className="text-sm text-muted-foreground">
                                            Showing {products.length} of {pagination.total} products
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {isLoading ? (
                            <div className="flex justify-center items-center h-64">
                                <LoadingSpinner />
                            </div>
                        ) : apiError ? (
                            <div className="flex flex-col justify-center items-center h-64">
                                <p className="text-red-500 mb-4">{apiError}</p>
                                <Button onClick={() => fetchProducts()}>Try Again</Button>
                            </div>
                        ) : products.length === 0 ? (
                            <div className="flex flex-col justify-center items-center h-64">
                                <p className="text-muted-foreground mb-4">No products found</p>
                                <Button onClick={() => router.push("/admin/products/create")} className="flex items-center gap-2">
                                    <PlusCircle size={16} />
                                    Add New Product
                                </Button>
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="w-12">Image</TableHead>
                                                <TableHead>Product</TableHead>
                                                <TableHead>SKU</TableHead>
                                                <TableHead>Category</TableHead>
                                                <TableHead>Price</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead>Status</TableHead>
                                                <TableHead className="text-right">Actions</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {products.map((product) => (
                                                <TableRow key={product.id}>
                                                    <TableCell>
                                                        {getPrimaryImage(product) ? (
                                                            <div className="relative h-10 w-10 overflow-hidden rounded-md">
                                                                <img
                                                                    src={getPrimaryImage(product)}
                                                                    alt={product.name}
                                                                    className="h-full w-full object-cover"
                                                                    onError={handleImageError}
                                                                />
                                                            </div>
                                                        ) : (
                                                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100">
                                                                <Package size={16} className="text-gray-400" />
                                                            </div>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{product.name}</span>
                                                            {product.name_bn && (
                                                                <span className="text-sm text-muted-foreground">{product.name_bn}</span>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="text-xs font-mono">
                                                            {product.sku}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {product.category?.name || (
                                                            <span className="text-muted-foreground">--</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span className="font-medium">{formatPrice(product.sale_price)}</span>
                                                            {product.discount_percentage > 0 && (
                                                                <div className="flex items-center gap-1">
                                                                    <span className="text-xs text-muted-foreground line-through">
                                                                        {formatPrice(product.base_price)}
                                                                    </span>
                                                                    <Badge variant="outline" className="text-xs">
                                                                        {product.discount_percentage}% off
                                                                    </Badge>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex flex-col">
                                                            <span>{product.current_stock}</span>
                                                            {product.current_stock <= (product.stock_alert_quantity || 0) && (
                                                                <Badge variant="destructive" className="text-xs">
                                                                    Low Stock
                                                                </Badge>
                                                            )}
                                                        </div>
                                                    </TableCell>
                                                    <TableCell>
                                                        <div className="flex items-center space-x-2">
                                                            <Switch
                                                                checked={product.status === 'active'}
                                                                onCheckedChange={() => handleStatusChange(product.id, product.status)}
                                                                disabled={product.status === 'draft'}
                                                            />
                                                            <Badge variant={STATUS_COLORS[product.status] as any}>
                                                                {product.status}
                                                            </Badge>
                                                        </div>
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <Button variant="ghost" size="icon">
                                                                    <MoreHorizontal size={16} />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                                <DropdownMenuItem
                                                                    onClick={() => router.push(`/admin/products/${product.id}`)}
                                                                >
                                                                    View Details
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() => router.push(`/admin/products/edit/${product.id}`)}
                                                                >
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuSeparator />
                                                                <DropdownMenuItem
                                                                    onClick={() => openDeleteDialog(product.id)}
                                                                    className="text-red-600"
                                                                >
                                                                    Delete
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                {/* Pagination */}
                                {pagination.last_page > 1 && (
                                    <div className="flex items-center justify-center space-x-2 mt-6">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(pagination.current_page - 1)}
                                            disabled={pagination.current_page <= 1}
                                        >
                                            Previous
                                        </Button>

                                        {[...Array(pagination.last_page)].map((_, i) => {
                                            const page = i + 1;
                                            // Show first, last, current, and adjacent pages
                                            if (
                                                page === 1 ||
                                                page === pagination.last_page ||
                                                (page >= pagination.current_page - 1 && page <= pagination.current_page + 1)
                                            ) {
                                                return (
                                                    <Button
                                                        key={page}
                                                        variant={pagination.current_page === page ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => changePage(page)}
                                                    >
                                                        {page}
                                                    </Button>
                                                );
                                            } else if (
                                                page === 2 ||
                                                page === pagination.last_page - 1
                                            ) {
                                                // Show ellipsis
                                                return <span key={page}>...</span>;
                                            }
                                            return null;
                                        })}

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => changePage(pagination.current_page + 1)}
                                            disabled={pagination.current_page >= pagination.last_page}
                                        >
                                            Next
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
                title="Delete Product"
                description="Are you sure you want to delete this product? This action cannot be undone and will remove all associated data."
            />
        </AdminLayout>
    );
};

export default ProductsPage;