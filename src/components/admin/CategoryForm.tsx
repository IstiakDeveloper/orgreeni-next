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
import { ArrowLeft, Save } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ImageUpload from "@/components/common/ImageUpload";

// API বেস URL
const API_URL = 'http://127.0.0.1:8080';

// Form validation schema
const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  name_bn: z.string().min(2, "Bangla name must be at least 2 characters"),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  parent_id: z.string().optional(), // This can be "0" or a category ID string
  description: z.string().optional(),
  description_bn: z.string().optional(),
  is_active: z.boolean().default(true),
  order: z.coerce.number().int().default(0),
});

type CategoryFormValues = z.infer<typeof categoryFormSchema>;

interface Category {
  id: number;
  name: string;
  name_bn: string;
  slug: string;
  description?: string;
  description_bn?: string;
  image?: string;
  parent_id?: number | null;
  is_active: boolean;
  order: number;
  created_at: string;
  updated_at: string;
}

interface ParentCategory {
  id: number;
  name: string;
  name_bn: string;
}

const CategoryForm = () => {
  const router = useRouter();
  const params = useParams();
  
  // Get the ID directly from params
  const id = params?.id as string;
  
  // Check if we're in edit mode by checking for id
  const isEditMode = !!id;
  const categoryId = isEditMode ? id : null;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [parentCategories, setParentCategories] = useState<ParentCategory[]>([]);

  // টোকেন পাওয়ার ফাংশন
  const getToken = (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('admin_token');
    }
    return null;
  };

  // Check authentication on page load
  useEffect(() => {
    const token = getToken();
    if (!token) {
      toast.error('Please login to continue');
      router.push('/admin/login');
      return;
    }

    // Load parent categories for dropdown
    fetchParentCategories();
  }, [router]);

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categoryFormSchema),
    defaultValues: {
      name: "",
      name_bn: "",
      slug: "",
      parent_id: "0", // Use "0" instead of undefined
      description: "",
      description_bn: "",
      is_active: true,
      order: 0,
    },
  });

  // Fetch parent categories for dropdown
  const fetchParentCategories = async () => {
    try {
      const token = getToken();
      
      const response = await axios.get(`${API_URL}/api/v1/admin/categories/parents-dropdown`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        setParentCategories(response.data.data.categories);
      }
    } catch (error) {
      console.error("Error fetching parent categories:", error);
      toast.error("Failed to load parent categories");
    }
  };

  useEffect(() => {
    if (isEditMode && categoryId) {
      fetchCategoryDetails(categoryId);
    }
  }, [isEditMode, categoryId]);

  const fetchCategoryDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const token = getToken();
      
      const response = await axios.get(`${API_URL}/api/v1/admin/categories/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const category = response.data.data.category;
        console.log("Fetched category data:", category);
        
        form.reset({
          name: category.name,
          name_bn: category.name_bn,
          slug: category.slug,
          parent_id: category.parent_id ? category.parent_id.toString() : "0", // Use "0" instead of undefined
          description: category.description || "",
          description_bn: category.description_bn || "",
          is_active: category.is_active,
          order: category.order,
        });
        
        // Set image preview if available
        if (category.image) {
          const imageUrl = `${API_URL}/storage/${category.image}`;
          console.log("Setting image preview URL:", imageUrl);
          setImagePreview(imageUrl);
        }
      }
    } catch (error: any) {
      console.error("Error fetching category details:", error);
      toast.error("Failed to load category details");
      
      // If unauthorized, redirect to login
      if (error.response?.status === 401) {
        localStorage.removeItem('admin_token');
        router.push('/admin/login');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    form.setValue("name", name);

    // Only auto-generate slug if it's empty or matches previous auto-generation
    const currentSlug = form.getValues("slug");
    const previousName = form.getValues("name");
    const previousAutoSlug = generateSlug(previousName);

    if (!currentSlug || currentSlug === previousAutoSlug) {
      form.setValue("slug", generateSlug(name));
    }
  };

  const handleImageUpload = (file: File | null) => {
    if (file) {
      const fileUrl = URL.createObjectURL(file);
      setImagePreview(fileUrl);
      setImageFile(file);
      console.log("Image file set for upload:", file.name);
    } else {
      setImagePreview(null);
      setImageFile(null);
      console.log("Image file cleared");
    }
  };

  const onSubmit = async (values: CategoryFormValues) => {
    setIsSubmitting(true);
    console.log("Form submitted with values:", values);
    console.log("Image file to upload:", imageFile);
    
    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        router.push('/admin/login');
        return;
      }

      // FormData for file upload
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('name_bn', values.name_bn);
      formData.append('slug', values.slug);
      
      // Handle parent_id correctly
      if (values.parent_id && values.parent_id !== "0") {
        formData.append('parent_id', values.parent_id);
      } else {
        // Send null for parent_id when "None" is selected
        formData.append('parent_id', '');
      }
      
      formData.append('description', values.description || '');
      formData.append('description_bn', values.description_bn || '');
      formData.append('is_active', values.is_active ? '1' : '0');
      formData.append('order', values.order.toString());
      
      // Append image file if selected
      if (imageFile) {
        formData.append('image', imageFile);
        console.log("Image file appended to form data");
      }

      let response;
      
      if (isEditMode && categoryId) {
        // Edit mode - use PUT method via form method spoofing
        formData.append('_method', 'PUT');
        console.log("Sending edit request to:", `${API_URL}/api/v1/admin/categories/${categoryId}`);
        
        response = await axios.post(
          `${API_URL}/api/v1/admin/categories/${categoryId}`, 
          formData,
          {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          }
        );
      } else {
        // Create mode
        console.log("Sending create request to:", `${API_URL}/api/v1/admin/categories`);
        
        response = await axios.post(
          `${API_URL}/api/v1/admin/categories`, 
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

      console.log("Server response:", response.data);

      if (response.data.success) {
        toast.success(`Category ${isEditMode ? "updated" : "created"} successfully`);
        router.push("/admin/categories");
      } else {
        toast.error(response.data.message || `Failed to ${isEditMode ? "update" : "create"} category`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} category:`, error);
      console.log("Server error response:", error.response?.data);
      
      // Show validation errors
      if (error.response?.data?.errors) {
        const firstError = Object.values(error.response.data.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        toast.error(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} category`);
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
              <CardTitle>{isEditMode ? "Edit" : "Create"} Category</CardTitle>
              <CardDescription>
                {isEditMode ? "Update category information" : "Add a new category to your store"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/categories")}
              className="mb-6"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Categories
            </Button>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category Name (English) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={handleNameChange}
                            placeholder="Enter category name" 
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
                        <FormLabel>Category Name (Bangla) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter category name in Bangla" 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="slug"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug *</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          placeholder="category-slug" 
                        />
                      </FormControl>
                      <FormDescription>
                        Used in URLs. Only lowercase letters, numbers, and hyphens.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="parent_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Parent Category</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a parent category (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="0">None (Top Level Category)</SelectItem>
                          {parentCategories.map((category) => (
                            <SelectItem 
                              key={category.id} 
                              value={category.id.toString()}
                              disabled={isEditMode && categoryId === category.id.toString()}
                            >
                              {category.name} ({category.name_bn})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Select a parent category or leave empty for a top-level category
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (English)</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Enter category description" 
                            rows={4}
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
                            {...field} 
                            placeholder="Enter category description in Bangla" 
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormItem>
                  <FormLabel>Category Image</FormLabel>
                  <div className="mb-4">
                    <ImageUpload
                      currentImage={imagePreview}
                      onImageUpload={handleImageUpload}
                    />
                  </div>
                  <FormDescription>
                    Upload an image for the category. Recommended size: 200x200px.
                  </FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Display Order</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          {...field}
                          min={0}
                        />
                      </FormControl>
                      <FormDescription>
                        Lower numbers will appear first. Categories with the same parent are sorted by this value.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>
                          Set the category as active or inactive in the store
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

                <Button
                  type="submit"
                  className="w-full md:w-auto"
                  disabled={isSubmitting}
                >
                  {isSubmitting && <LoadingSpinner size="sm" className="mr-2" />}
                  <Save size={16} className="mr-2" />
                  {isEditMode ? "Update Category" : "Create Category"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default CategoryForm;