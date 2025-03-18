"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";

import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Save, Plus, Trash, Upload, X, Check, Package } from "lucide-react";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ImageUpload from "@/components/common/ImageUpload";

// API বেস URL
const API_URL = 'http://127.0.0.1:8080';

// Product form validation schema
const productFormSchema = z.object({
    name: z.string().min(2, "Product name must be at least 2 characters"),
    name_bn: z.string().optional(),
    description: z.string().optional(),
    description_bn: z.string().optional(),
    category_id: z.string().min(1, "Category is required"),
    brand_id: z.string().optional(),
    unit_id: z.string().optional(),
    sku: z.string().min(2, "SKU is required"),
    barcode: z.string().optional(),
    base_price: z.coerce.number().min(0, "Base price must be at least 0"),
    sale_price: z.coerce.number().min(0, "Sale price must be at least 0"),
    discount_percentage: z.coerce.number().min(0).max(100).optional(),
    weight: z.coerce.number().min(0).optional(),
    is_vat_applicable: z.boolean().default(false),
    vat_percentage: z.coerce.number().min(0).max(100).optional(),
    is_featured: z.boolean().default(false),
    is_popular: z.boolean().default(false),
    stock_alert_quantity: z.coerce.number().int().min(0).default(10),
    status: z.enum(["active", "inactive", "draft"]).default("draft"),
    meta_title: z.string().optional(),
    meta_description: z.string().optional(),
    meta_keywords: z.string().optional(),
    stock_quantity: z.coerce.number().int().min(0).optional(),
});

type ProductFormValues = z.infer<typeof productFormSchema>;

interface Category {
    id: number;
    name: string;
    name_bn?: string;
}

interface Brand {
    id: number;
    name: string;
    name_bn?: string;
}

interface Unit {
    id: number;
    name: string;
    name_bn?: string;
}

interface ProductImage {
    id?: number;
    product_id?: number;
    image: string;
    is_primary: boolean;
    file?: File; // For new uploads
}

const ProductForm = () => {
    const router = useRouter();
    const params = useParams();

    // Get the ID directly from params
    const id = params?.id as string;

    // Check if we're in edit mode by checking for id
    const isEditMode = !!id;
    const productId = isEditMode ? id : null;

    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [activeTab, setActiveTab] = useState<string>("basic");

    // Dropdown data
    const [categories, setCategories] = useState<Category[]>([]);
    const [brands, setBrands] = useState<Brand[]>([]);
    const [units, setUnits] = useState<Unit[]>([]);

    // Image handling
    const [productImages, setProductImages] = useState<ProductImage[]>([]);
    const [pendingImageUploads, setPendingImageUploads] = useState<File[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<number[]>([]);

    // টোকেন পাওয়ার ফাংশন
    const getToken = (): string | null => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('admin_token');
        }
        return null;
    };

    const form = useForm<ProductFormValues>({
        resolver: zodResolver(productFormSchema),
        defaultValues: {
            name: "",
            name_bn: "",
            description: "",
            description_bn: "",
            category_id: "",
            brand_id: "0", // Using "0" instead of empty string
            unit_id: "0", // Using "0" instead of empty string
            sku: "",
            barcode: "",
            base_price: 0,
            sale_price: 0,
            discount_percentage: 0,
            weight: 0,
            is_vat_applicable: false,
            vat_percentage: 0,
            is_featured: false,
            is_popular: false,
            stock_alert_quantity: 10,
            status: "draft",
            meta_title: "",
            meta_description: "",
            meta_keywords: "",
            stock_quantity: 0,
        },
    });

    // Check authentication and load dropdown data on mount
    useEffect(() => {
        const token = getToken();
        if (!token) {
            toast.error('Please login to continue');
            router.push('/admin/login');
            return;
        }

        fetchDropdownData();
    }, [router]);

    // Fetch product details in edit mode
    useEffect(() => {
        if (isEditMode && productId) {
            fetchProductDetails(productId);
        }
    }, [isEditMode, productId]);

    // Fetch dropdown data (categories, brands, units)
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

    // Fetch product details for edit
    const fetchProductDetails = async (id: string) => {
        setIsLoading(true);
        try {
            const token = getToken();

            const response = await axios.get(`${API_URL}/api/v1/admin/products/${id}`, {
                headers: {
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.data.success) {
                const product = response.data.data.product;
                console.log("Fetched product data:", product);

                // Set form values
                form.reset({
                    name: product.name,
                    name_bn: product.name_bn || "",
                    description: product.description || "",
                    description_bn: product.description_bn || "",
                    category_id: product.category_id.toString(),
                    brand_id: product.brand_id ? product.brand_id.toString() : "0",
                    unit_id: product.unit_id ? product.unit_id.toString() : "0",
                    sku: product.sku,
                    barcode: product.barcode || "",
                    base_price: product.base_price,
                    sale_price: product.sale_price,
                    discount_percentage: product.discount_percentage || 0,
                    weight: product.weight || 0,
                    is_vat_applicable: product.is_vat_applicable,
                    vat_percentage: product.vat_percentage || 0,
                    is_featured: product.is_featured,
                    is_popular: product.is_popular,
                    stock_alert_quantity: product.stock_alert_quantity || 10,
                    status: product.status,
                    meta_title: product.meta_title || "",
                    meta_description: product.meta_description || "",
                    meta_keywords: product.meta_keywords || "",
                    stock_quantity: product.current_stock || 0,
                });

                // Set product images
                if (product.images && product.images.length > 0) {
                    setProductImages(product.images.map(img => ({
                        id: img.id,
                        product_id: img.product_id,
                        image: img.image,
                        is_primary: img.is_primary
                    })));
                }
            }
        } catch (error: any) {
            console.error("Error fetching product details:", error);
            toast.error("Failed to load product details");

            if (error.response?.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
            }
        } finally {
            setIsLoading(false);
        }
    };

    // Calculate discounted price
    const calculateDiscountedPrice = () => {
        const basePrice = form.getValues("base_price");
        const discountPercentage = form.getValues("discount_percentage") || 0;

        if (basePrice && discountPercentage > 0) {
            const discountAmount = (basePrice * discountPercentage) / 100;
            const salePrice = basePrice - discountAmount;
            form.setValue("sale_price", parseFloat(salePrice.toFixed(2)));
        } else {
            form.setValue("sale_price", basePrice);
        }
    };

    // Handle image uploads
    const handleImageUpload = (file: File) => {
        if (!file) return;

        // Create preview
        const reader = new FileReader();
        reader.onload = () => {
            const newImage: ProductImage = {
                image: reader.result as string,
                is_primary: productImages.length === 0, // First image is primary
                file: file
            };

            setProductImages(prev => [...prev, newImage]);
            setPendingImageUploads(prev => [...prev, file]);
        };
        reader.readAsDataURL(file);
    };

    // Handle image delete
    const handleImageDelete = (index: number) => {
        const imageToDelete = productImages[index];

        // If server-side image, add to delete list
        if (imageToDelete.id) {
            setImagesToDelete(prev => [...prev, imageToDelete.id!]);
        }

        // Remove from pending uploads if applicable
        if (imageToDelete.file) {
            setPendingImageUploads(prev =>
                prev.filter(f => f !== imageToDelete.file)
            );
        }

        // Remove from UI
        setProductImages(prev => {
            const newImages = [...prev];
            newImages.splice(index, 1);

            // If deleted the primary image, set a new primary
            if (imageToDelete.is_primary && newImages.length > 0) {
                newImages[0].is_primary = true;
            }

            return newImages;
        });
    };

    // Set image as primary
    const setImageAsPrimary = (index: number) => {
        setProductImages(prev => {
            return prev.map((img, i) => ({
                ...img,
                is_primary: i === index
            }));
        });
    };

    // Generate random SKU
    const generateSKU = () => {
        const prefix = "PRD";
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        const sku = `${prefix}-${timestamp}-${random}`;
        form.setValue("sku", sku);
    };

    // Form submission
    const onSubmit = async (values: ProductFormValues) => {
        setIsSubmitting(true);
        console.log("Form submitted with values:", values);

        try {
            const token = getToken();

            if (!token) {
                toast.error("Authentication required");
                router.push('/admin/login');
                return;
            }

            // Create FormData for file uploads
            const formData = new FormData();

            // Append all form fields
            Object.entries(values).forEach(([key, value]) => {
                if (value !== undefined && value !== null) {
                    // Handle select dropdowns with "0" value
                    if ((key === 'brand_id' || key === 'unit_id') && value === "0") {
                        formData.append(key, '');
                    } else if (typeof value === 'boolean') {
                        formData.append(key, value ? '1' : '0');
                    } else {
                        formData.append(key, value.toString());
                    }
                }
            });

            // Append image files for new product
            if (!isEditMode && pendingImageUploads.length > 0) {
                pendingImageUploads.forEach(file => {
                    formData.append('images[]', file);
                });
            }

            let response;

            if (isEditMode && productId) {
                // For edit mode, use the update endpoint
                response = await axios.post(
                    `${API_URL}/api/v1/admin/products/${productId}`,
                    formData,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );

                // If we have pending image uploads in edit mode, upload them separately
                if (pendingImageUploads.length > 0) {
                    const imageFormData = new FormData();
                    pendingImageUploads.forEach(file => {
                        imageFormData.append('images[]', file);
                    });

                    await axios.post(
                        `${API_URL}/api/v1/admin/products/${productId}/images`,
                        imageFormData,
                        {
                            headers: {
                                'Accept': 'application/json',
                                'Content-Type': 'multipart/form-data',
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                }

                // Delete images if needed
                for (const imageId of imagesToDelete) {
                    await axios.delete(
                        `${API_URL}/api/v1/admin/products/${productId}/images/${imageId}`,
                        {
                            headers: {
                                'Accept': 'application/json',
                                'Authorization': `Bearer ${token}`
                            }
                        }
                    );
                }
            } else {
                // For create mode
                response = await axios.post(
                    `${API_URL}/api/v1/admin/products`,
                    formData,
                    {
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${token}`
                        }
                    }
                );
            }

            if (response.data.success) {
                toast.success(`Product ${isEditMode ? "updated" : "created"} successfully`);
                router.push("/admin/products");
            } else {
                toast.error(response.data.message || `Failed to ${isEditMode ? "update" : "create"} product`);
            }
        } catch (error: any) {
            console.error(`Error ${isEditMode ? "updating" : "creating"} product:`, error);

            // Show validation errors
            if (error.response?.data?.errors) {
                const firstError = Object.values(error.response.data.errors)[0];
                toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
            } else {
                toast.error(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} product`);
            }

            // Authorization error check
            if (error.response?.status === 401) {
                localStorage.removeItem('admin_token');
                router.push('/admin/login');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) {
        return (
            <AdminLayout>
                <div className="flex justify-center items-center h-64">
                    <LoadingSpinner />
                </div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout>
            <div className="container mx-auto px-4 py-6">
                <Card>
                    <CardHeader className="flex flex-row items-center">
                        <div>
                            <CardTitle>{isEditMode ? "Edit" : "Create"} Product</CardTitle>
                            <CardDescription>
                                {isEditMode ? "Update product information" : "Add a new product to your store"}
                            </CardDescription>
                        </div>
                    </CardHeader>

                    <CardContent>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/admin/products")}
                            className="mb-6"
                        >
                            <ArrowLeft size={16} className="mr-2" />
                            Back to Products
                        </Button>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                                    <TabsList className="grid grid-cols-4 md:w-auto">
                                        <TabsTrigger value="basic">Basic Info</TabsTrigger>
                                        <TabsTrigger value="images">Images</TabsTrigger>
                                        <TabsTrigger value="pricing">Pricing</TabsTrigger>
                                        <TabsTrigger value="meta">SEO & Options</TabsTrigger>
                                    </TabsList>

                                    {/* Basic Info Tab */}
                                    <TabsContent value="basic" className="space-y-6 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product Name (English) *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter product name"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="name_bn"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product Name (Bangla)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter product name in Bangla"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="category_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Category *</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select category" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                {categories.map((category) => (
                                                                    <SelectItem
                                                                        key={category.id}
                                                                        value={category.id.toString()}
                                                                    >
                                                                        {category.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="brand_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Brand</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select brand" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="0">None</SelectItem>
                                                                {brands.map((brand) => (
                                                                    <SelectItem
                                                                        key={brand.id}
                                                                        value={brand.id.toString()}
                                                                    >
                                                                        {brand.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="unit_id"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Unit</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select unit" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="0">None</SelectItem>
                                                                {units.map((unit) => (
                                                                    <SelectItem
                                                                        key={unit.id}
                                                                        value={unit.id.toString()}
                                                                    >
                                                                        {unit.name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description (English)</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter product description"
                                                                rows={4}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="description_bn"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Description (Bangla)</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter product description in Bangla"
                                                                rows={4}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <FormField
                                                    control={form.control}
                                                    name="sku"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>SKU (Stock Keeping Unit) *</FormLabel>
                                                            <div className="flex gap-2">
                                                                <FormControl>
                                                                    <Input
                                                                        placeholder="Enter product SKU"
                                                                        {...field}
                                                                    />
                                                                </FormControl>
                                                                <Button
                                                                    type="button"
                                                                    variant="outline"
                                                                    onClick={generateSKU}
                                                                >
                                                                    Generate
                                                                </Button>
                                                            </div>
                                                            <FormDescription>
                                                                Unique product identifier for inventory management
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="barcode"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Barcode</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter product barcode"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Optional barcode for product scanning
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="weight"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Product Weight (kg)</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Enter product weight"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Used for shipping calculations
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </TabsContent>

                                    {/* Images Tab */}
                                    <TabsContent value="images" className="space-y-6 pt-4">
                                        <div className="space-y-4">
                                            <div className="flex flex-wrap gap-4">
                                                {productImages.map((image, index) => (
                                                    <div
                                                        key={index}
                                                        className="relative w-40 h-40 border rounded-md overflow-hidden group"
                                                    >
                                                        <img
                                                            src={image.id ? `${API_URL}/storage/${image.image}` : image.image}
                                                            alt={`Product image ${index + 1}`}
                                                            className="w-full h-full object-cover"
                                                        />
                                                        <div className="absolute inset-0 bg-black/50 flex flex-col justify-center items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                type="button"
                                                                variant="secondary"
                                                                size="sm"
                                                                className={image.is_primary ? "bg-green-500 hover:bg-green-600" : ""}
                                                                onClick={() => setImageAsPrimary(index)}
                                                                disabled={image.is_primary}
                                                            >
                                                                {image.is_primary ? "Primary" : "Set as Primary"}
                                                            </Button>
                                                            <Button
                                                                type="button"
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleImageDelete(index)}
                                                            >
                                                                Remove
                                                            </Button>
                                                        </div>
                                                        {image.is_primary && (
                                                            <div className="absolute top-1 right-1 bg-green-500 text-white rounded-full p-1">
                                                                <Check size={14} />
                                                            </div>
                                                        )}
                                                    </div>
                                                ))}

                                                <div className="w-40 h-40 border border-dashed rounded-md flex flex-col justify-center items-center cursor-pointer hover:bg-gray-50"
                                                    onClick={() => document.getElementById('image-upload')?.click()}>
                                                    <Upload size={24} className="text-gray-400" />
                                                    <p className="text-sm text-gray-500 mt-2">Upload Image</p>
                                                    <input
                                                        id="image-upload"
                                                        type="file"
                                                        accept="image/*"
                                                        className="hidden"
                                                        onChange={(e) => {
                                                            if (e.target.files && e.target.files[0]) {
                                                                handleImageUpload(e.target.files[0]);
                                                                e.target.value = ''; // Reset input
                                                            }
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <FormDescription>
                                                Upload product images. First image or image marked as primary will be the main product image.
                                            </FormDescription>

                                            {productImages.length === 0 && (
                                                <p className="text-yellow-600 text-sm">
                                                    Please add at least one product image
                                                </p>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* Pricing Tab */}
                                    <TabsContent value="pricing" className="space-y-6 pt-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="base_price"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Base Price *</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                placeholder="Enter base price"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e);
                                                                    calculateDiscountedPrice();
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Regular price before discount
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="discount_percentage"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Discount (%)</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                max="100"
                                                                placeholder="Enter discount percentage"
                                                                {...field}
                                                                onChange={(e) => {
                                                                    field.onChange(e);
                                                                    calculateDiscountedPrice();
                                                                }}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Percentage discount to apply
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <FormField
                                            control={form.control}
                                            name="sale_price"
                                            render={({ field }) => (
                                                <FormItem><FormLabel>Sale Price *</FormLabel>
                                                    <FormControl>
                                                        <Input
                                                            type="number"
                                                            step="0.01"
                                                            placeholder="Enter sale price"
                                                            {...field}
                                                        />
                                                    </FormControl>
                                                    <FormDescription>
                                                        Final price after discount
                                                    </FormDescription>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <FormField
                                                control={form.control}
                                                name="is_vat_applicable"
                                                render={({ field }) => (
                                                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                        <div className="space-y-0.5">
                                                            <FormLabel className="text-base">VAT Applicable</FormLabel>
                                                            <FormDescription>
                                                                Enable if this product is subject to VAT
                                                            </FormDescription>
                                                        </div>
                                                        <FormControl>
                                                            <Switch
                                                                checked={field.value}
                                                                onCheckedChange={field.onChange}
                                                            />
                                                        </FormControl>
                                                    </FormItem>
                                                )}
                                            />

                                            {form.watch("is_vat_applicable") && (
                                                <FormField
                                                    control={form.control}
                                                    name="vat_percentage"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>VAT Percentage (%)</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    max="100"
                                                                    placeholder="Enter VAT percentage"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            )}
                                        </div>

                                        <div className="border rounded-md p-4">
                                            <h3 className="text-base font-medium mb-2">Stock Information</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="stock_quantity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Initial Stock Quantity</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="1"
                                                                    min="0"
                                                                    placeholder="Enter stock quantity"
                                                                    {...field}
                                                                    disabled={isEditMode}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                {isEditMode ?
                                                                    "Stock quantity can only be set during product creation. Use inventory management to update stock." :
                                                                    "Number of items initially in stock"}
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="stock_alert_quantity"
                                                    render={({ field }) => (
                                                        <FormItem>
                                                            <FormLabel>Low Stock Alert</FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    type="number"
                                                                    step="1"
                                                                    min="0"
                                                                    placeholder="Enter alert quantity"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormDescription>
                                                                Get notified when stock falls below this number
                                                            </FormDescription>
                                                            <FormMessage />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* SEO & Options Tab */}
                                    <TabsContent value="meta" className="space-y-6 pt-4">
                                        <div className="border rounded-md p-4 space-y-4">
                                            <h3 className="text-base font-medium mb-2">Product Options</h3>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <FormField
                                                    control={form.control}
                                                    name="is_featured"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Featured Product</FormLabel>
                                                                <FormDescription>
                                                                    Display this product in featured section
                                                                </FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />

                                                <FormField
                                                    control={form.control}
                                                    name="is_popular"
                                                    render={({ field }) => (
                                                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                                                            <div className="space-y-0.5">
                                                                <FormLabel className="text-base">Popular Product</FormLabel>
                                                                <FormDescription>
                                                                    Mark this product as popular
                                                                </FormDescription>
                                                            </div>
                                                            <FormControl>
                                                                <Switch
                                                                    checked={field.value}
                                                                    onCheckedChange={field.onChange}
                                                                />
                                                            </FormControl>
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>

                                            <FormField
                                                control={form.control}
                                                name="status"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Product Status</FormLabel>
                                                        <Select
                                                            value={field.value}
                                                            onValueChange={field.onChange}
                                                        >
                                                            <FormControl>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder="Select status" />
                                                                </SelectTrigger>
                                                            </FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="active">Active</SelectItem>
                                                                <SelectItem value="inactive">Inactive</SelectItem>
                                                                <SelectItem value="draft">Draft</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormDescription>
                                                            Set product visibility and availability
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>

                                        <div className="border rounded-md p-4 space-y-4">
                                            <h3 className="text-base font-medium mb-2">SEO Information</h3>
                                            <FormField
                                                control={form.control}
                                                name="meta_title"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Meta Title</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter meta title"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Title displayed in search engine results (defaults to product name if empty)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="meta_description"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Meta Description</FormLabel>
                                                        <FormControl>
                                                            <Textarea
                                                                placeholder="Enter meta description"
                                                                rows={3}
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Description displayed in search engine results
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />

                                            <FormField
                                                control={form.control}
                                                name="meta_keywords"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Meta Keywords</FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                placeholder="Enter meta keywords, separated by commas"
                                                                {...field}
                                                            />
                                                        </FormControl>
                                                        <FormDescription>
                                                            Keywords for search engines (comma separated)
                                                        </FormDescription>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                    </TabsContent>
                                </Tabs>

                                <div className="mt-6 flex justify-end gap-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => router.push("/admin/products")}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="submit"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                                        <Save size={16} className="mr-2" />
                                        {isEditMode ? "Update" : "Create"} Product
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>
            </div>
        </AdminLayout>
    );
};

export default ProductForm;