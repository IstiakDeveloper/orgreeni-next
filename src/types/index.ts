export interface User {
    id: number;
    name: string;
    email?: string;
    phone: string;
    role: 'admin' | 'manager';
    is_active: boolean;
    profile_photo?: string;
  }
  
  export interface LoginResponse {
    success: boolean;
    message: string;
    data?: {
      user: User;
      token: string;
      abilities: string[];
    };
  }
  
  export interface ApiResponse<T> {
    success: boolean;
    message?: string;
    data?: T;
    errors?: Record<string, string[]>;
  }