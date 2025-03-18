import axios from 'axios';
import { LoginResponse, User, ApiResponse } from './types';
import { BASE_URL } from '@/config/constants';

class AuthService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BASE_URL}/v1/admin`;
  }

  // Method to get authentication token from local storage
  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('admin_token') : null;
  }

  // Method to set authentication token in local storage
  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('admin_token', token);
    }
  }

  // Method to remove authentication token
  removeToken(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
    }
  }

  // Login method
  async login(phone: string, password: string): Promise<LoginResponse> {
    try {
      // Change this line to use the correct endpoint
      const response = await axios.post<LoginResponse>(`${BASE_URL}/v1/admin/login`, {
        phone,
        password
      });

      if (response.data.success && response.data.data?.token) {
        this.setToken(response.data.data.token);
      }

      return response.data;
    } catch (error: any) {
      console.error('Login error:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  }

  // Logout method
  async logout(): Promise<ApiResponse<null>> {
    try {
      const token = this.getToken();
      const response = await axios.post<ApiResponse<null>>(
        `${this.baseUrl}/logout`,
        {},
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        this.removeToken();
      }

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Logout failed',
      };
    }
  }

  // Get current user method
  async getCurrentUser(): Promise<ApiResponse<{ user: User }>> {
    try {
      const token = this.getToken();
      const response = await axios.get<ApiResponse<{ user: User }>>(
        `${this.baseUrl}/user`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch user',
      };
    }
  }

  // Change password method
  async changePassword(
    currentPassword: string,
    password: string,
    passwordConfirmation: string
  ): Promise<ApiResponse<null>> {
    try {
      const token = this.getToken();
      const response = await axios.post<ApiResponse<null>>(
        `${this.baseUrl}/change-password`,
        {
          current_password: currentPassword,
          password,
          password_confirmation: passwordConfirmation
        },
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Password change failed',
      };
    }
  }

  // Update profile method
  async updateProfile(
    data: FormData
  ): Promise<ApiResponse<{ user: User }>> {
    try {
      const token = this.getToken();
      const response = await axios.post<ApiResponse<{ user: User }>>(
        `${this.baseUrl}/update-profile`,
        data,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          }
        }
      );

      return response.data;
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || 'Profile update failed',
      };
    }
  }
}

export default new AuthService();