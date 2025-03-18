"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "react-hot-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import axios from "axios";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import LoadingSpinner from "@/components/common/LoadingSpinner";

// API বেস URL - আপনার Laravel API URL সেট করুন
const API_URL = 'http://127.0.0.1:8080';

// ফর্ম ভ্যালিডেশন স্কিমা
const loginFormSchema = z.object({
  phone: z.string().regex(/^01[3-9]\d{8}$/, "Phone number must be a valid 11-digit BD number"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  // পেজ লোড হওয়ার সময় অথেনটিকেশন চেক করুন
  useEffect(() => {
    const checkAuth = async () => {
      setCheckingAuth(true);
      const token = localStorage.getItem("admin_token");
      
      if (!token) {
        setCheckingAuth(false);
        return;
      }
      
      try {
        // টোকেন ভ্যালিড কিনা চেক করুন
        const response = await axios.get(`${API_URL}/api/v1/admin/user`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (response.data.success) {
          // ইউজার তথ্য স্টোর করুন
          localStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
          
          // যদি লগইন অবস্থায় থাকেন, ড্যাশবোর্ডে রিডাইরেক্ট করুন
          router.push("/admin/dashboard");
        } else {
          // ইনভ্যালিড রেসপন্স - টোকেন মুছে ফেলুন
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
        }
      } catch (error) {
        console.error("Auth check error:", error);
        // এরর হলে টোকেন মুছে ফেলুন
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
      } finally {
        setCheckingAuth(false);
      }
    };
    
    checkAuth();
  }, [router]);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      phone: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setIsLoading(true);
    try {
      console.log("Submitting login form:", values);
      
      // লগইন API কল করুন
      const response = await axios.post(`${API_URL}/api/v1/admin/login`, values, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Login response:", response.data);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        
        // টোকেন এবং ইউজার ডাটা স্টোর করুন
        localStorage.setItem("admin_token", token);
        localStorage.setItem("admin_user", JSON.stringify(user));
        
        // কুকিতেও টোকেন স্টোর করুন
        document.cookie = `admin_token=${token}; path=/; max-age=86400; SameSite=Lax`;
        
        // সাকসেস মেসেজ দেখান
        toast.success("Login successful! Redirecting...");
        
        // ড্যাশবোর্ডে রিডাইরেক্ট করুন
        router.push("/admin/dashboard");
      } else {
        toast.error(response.data.message || "Login failed");
      }
    } catch (error: any) {
      console.error("Login error:", error);
      
      // এরর মেসেজ দেখান
      const errorMessage = error.response?.data?.message || "Login failed. Please check your credentials.";
      toast.error(errorMessage);
      
      // কনসোলে এরর ডিটেইলস দেখান
      if (error.response) {
        console.error("Response data:", error.response.data);
        console.error("Response status:", error.response.status);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // যদি অথেনটিকেশন চেক চলছে, লোডিং দেখান
  if (checkingAuth) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md p-4">
        <Card className="w-full shadow-lg">
          <CardHeader className="space-y-4 items-center text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white text-xl font-bold">
                Store
              </div>
            </div>
            <CardTitle className="text-2xl">Admin Login</CardTitle>
            <CardDescription>
              Enter your credentials to access the admin panel
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="01XXXXXXXXX"
                          type="tel"
                          autoComplete="tel"
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            {...field}
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={isLoading}
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 py-2"
                            onClick={togglePasswordVisibility}
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff size={16} />
                            ) : (
                              <Eye size={16} />
                            )}
                          </Button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <LoadingSpinner size="sm" className="mr-2" />
                  ) : (
                    <LogIn size={16} className="mr-2" />
                  )}
                  Log In
                </Button>
              </form>
            </Form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <div className="text-sm text-center text-muted-foreground">
              This page is exclusively for administrators.
            </div>
            <div className="text-sm text-center">
              <Link href="/" className="text-primary hover:underline">
                Return to store homepage
              </Link>
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}