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
import LoadingSpinner from "@/components/common/LoadingSpinner";
import ImageUpload from "@/components/common/ImageUpload";

// API বেস URL
const API_URL = 'http://127.0.0.1:8080';

// Form validation schema
const brandFormSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters"),
  name_bn: z.string().optional(),
  slug: z.string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9-]+$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  description_bn: z.string().optional(),
  is_active: z.boolean().default(true),
  // ইমেজ ফিল্ড ফর্মে যোগ করা হবে না, এটি আলাদাভাবে হ্যান্ডেল করা হবে
  logo_preview: z.any().optional() // কেবল UI এর জন্য
});

type BrandFormValues = z.infer<typeof brandFormSchema>;

interface Brand {
  id: number;
  name: string;
  name_bn?: string;
  slug: string;
  description?: string;
  description_bn?: string;
  logo?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ApiResponse {
  success: boolean;
  data: {
    brand: Brand;
  };
  message?: string;
}

const BrandForm = () => {
  const router = useRouter();
  const params = useParams();
  
  const action = params?.action as string;
  const id = params?.id as string;
  
  const isEditMode = action === "edit";
  const brandId = isEditMode ? id : null;

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);

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
    }
  }, [router]);

  const form = useForm<BrandFormValues>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: {
      name: "",
      name_bn: "",
      slug: "",
      description: "",
      description_bn: "",
      is_active: true,
    },
  });

  useEffect(() => {
    if (isEditMode && brandId) {
      fetchBrandDetails(brandId);
    }
  }, [isEditMode, brandId]);

  const fetchBrandDetails = async (id: string) => {
    setIsLoading(true);
    try {
      const token = getToken();
      
      const response = await axios.get(`${API_URL}/api/v1/admin/brands/${id}`, {
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.data.success) {
        const brand = response.data.data.brand;
        form.reset({
          name: brand.name,
          name_bn: brand.name_bn || "",
          slug: brand.slug,
          description: brand.description || "",
          description_bn: brand.description_bn || "",
          is_active: brand.is_active
        });
        
        // লোগো এর URL সেট করুন যদি থাকে
        if (brand.logo) {
          // ডিরেক্ট স্টোরেজ পাথ ব্যবহার করুন যা ইনডেক্স পেজেও ব্যবহার করা হয়
          const logoUrl = `${API_URL}/storage/${brand.logo}`;
          setLogoPreview(logoUrl);
        }
      }
    } catch (error: any) {
      console.error("Error fetching brand details:", error);
      toast.error("Failed to load brand details");
      
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

  const handleLogoUpload = (file: File | null) => {
    if (file) {
      // ফাইল প্রিভিউ দেখানোর জন্য URL তৈরি করুন
      const fileUrl = URL.createObjectURL(file);
      setLogoPreview(fileUrl);
      // ফাইল সেভ করুন যাতে ফর্ম সাবমিশন এর সময় ব্যবহার করা যায়
      setLogoFile(file);
    } else {
      setLogoPreview(null);
      setLogoFile(null);
    }
  };

  const onSubmit = async (values: BrandFormValues) => {
    setIsSubmitting(true);
    
    try {
      const token = getToken();
      
      if (!token) {
        toast.error("Authentication required");
        router.push('/admin/login');
        return;
      }

      // FormData ব্যবহার করুন যাতে ফাইল আপলোড করা যায়
      const formData = new FormData();
      formData.append('name', values.name);
      formData.append('name_bn', values.name_bn || '');
      formData.append('slug', values.slug);
      formData.append('description', values.description || '');
      formData.append('description_bn', values.description_bn || '');
      formData.append('is_active', values.is_active ? '1' : '0');
      
      // লোগো ফাইল যোগ করুন যদি থাকে
      if (logoFile) {
        formData.append('logo', logoFile);
      }

      // স্পষ্টভাবে স্টোরেজ পাথ উল্লেখ করুন
      formData.append('storage_path', 'public'); // মূল স্টোরেজ ডিরেক্টরি নির্দেশ করুন

      let response;
      
      if (isEditMode && brandId) {
        // এডিট মোডে PUT এর বদলে POST রিকোয়েস্ট করুন, এবং _method=PUT যোগ করুন (Laravel এর form method spoofing)
        formData.append('_method', 'PUT');
        response = await axios.post(
          `${API_URL}/api/v1/admin/brands/${brandId}`, 
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
        response = await axios.post(
          `${API_URL}/api/v1/admin/brands`, 
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
        toast.success(`Brand ${isEditMode ? "updated" : "created"} successfully`);
        router.push("/admin/brands");
      } else {
        toast.error(response.data.message || `Failed to ${isEditMode ? "update" : "create"} brand`);
      }
    } catch (error: any) {
      console.error(`Error ${isEditMode ? "updating" : "creating"} brand:`, error);
      
      // ডিবাগিংয়ের জন্য সার্ভার রেসপন্স লগ করুন
      console.log("Server response:", error.response?.data);
      
      // এরর বার্তা দেখান
      if (error.response?.data?.errors) {
        // এরর অবজেক্ট থেকে প্রথম এরর মেসেজ
        const firstError = Object.values(error.response.data.errors)[0];
        toast.error(Array.isArray(firstError) ? firstError[0] : String(firstError));
      } else {
        toast.error(error.response?.data?.message || `Failed to ${isEditMode ? "update" : "create"} brand`);
      }
      
      // অথোরাইজেশন এরর চেক করুন
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
              <CardTitle>{isEditMode ? "Edit" : "Create"} Brand</CardTitle>
              <CardDescription>
                {isEditMode ? "Update brand information" : "Add a new brand to your store"}
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent>
            <Button
              variant="outline"
              onClick={() => router.push("/admin/brands")}
              className="mb-6"
            >
              <ArrowLeft size={16} className="mr-2" />
              Back to Brands
            </Button>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Brand Name (English) *</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            onChange={handleNameChange}
                            placeholder="Enter brand name" 
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
                        <FormLabel>Brand Name (Bangla)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            placeholder="Enter brand name in Bangla" 
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
                          placeholder="brand-slug" 
                        />
                      </FormControl>
                      <FormDescription>
                        Used in URLs. Only lowercase letters, numbers, and hyphens.
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
                            placeholder="Enter brand description" 
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
                            placeholder="Enter brand description in Bangla" 
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormItem>
                  <FormLabel>Brand Logo</FormLabel>
                  <div className="mb-4">
                    <ImageUpload
                      currentImage={logoPreview}
                      onImageUpload={handleLogoUpload}
                    />
                  </div>
                  <FormDescription>
                    Upload a logo for the brand. Recommended size: 200x200px.
                  </FormDescription>
                </FormItem>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Active Status</FormLabel>
                        <FormDescription>
                          Set the brand as active or inactive in the store
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
                  {isEditMode ? "Update Brand" : "Create Brand"}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default BrandForm;