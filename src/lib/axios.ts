// lib/axios.ts
import axios from 'axios';

// API URL সেট করুন - এটি আপনার Laravel বেকএন্ড এর URL হবে
const API_URL = 'http://127.0.0.1:8080'; // আপনার লারাভেল সার্ভার URL এখানে সেট করুন

const axiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true, // CSRF প্রটেকশনের জন্য
});

// Request interceptor যোগ করুন
axiosInstance.interceptors.request.use(
  (config) => {
    // প্রতিটি রিকোয়েস্টে টোকেন যোগ করুন
    const token = localStorage.getItem('admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor যোগ করুন
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // 401 Unauthorized এরর হ্যান্ডলিং
    if (error.response?.status === 401) {
      // টোকেন ইনভ্যালিড হলে লগইন পেজে রিডাইরেক্ট করুন
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_user');
      window.location.href = '/admin/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;