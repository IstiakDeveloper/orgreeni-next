// File: src/services/address-service.ts
import axios from 'axios';
import { BASE_URL } from '@/config/constants';
import { Address, AddressResponse } from '@/types/address';
import AuthService from './auth-service';

class AddressService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BASE_URL}/v1/admin`;
  }

  // Get all user addresses
  async getAddresses(): Promise<AddressResponse> {
    try {
      const token = AuthService.getToken();
      const response = await axios.get<AddressResponse>(
        `${this.baseUrl}/user/addresses`,
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
        message: error.response?.data?.message || 'Failed to fetch addresses'
      };
    }
  }

  // Add a new address
  async addAddress(addressData: Address): Promise<AddressResponse> {
    try {
      const token = AuthService.getToken();
      const response = await axios.post<AddressResponse>(
        `${this.baseUrl}/user/addresses`,
        addressData,
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
        message: error.response?.data?.message || 'Failed to add address'
      };
    }
  }

  // Update an existing address
  async updateAddress(id: number, addressData: Address): Promise<AddressResponse> {
    try {
      const token = AuthService.getToken();
      const response = await axios.put<AddressResponse>(
        `${this.baseUrl}/user/addresses/${id}`,
        addressData,
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
        message: error.response?.data?.message || 'Failed to update address'
      };
    }
  }

  // Delete an address
  async deleteAddress(id: number): Promise<AddressResponse> {
    try {
      const token = AuthService.getToken();
      const response = await axios.delete<AddressResponse>(
        `${this.baseUrl}/user/addresses/${id}`,
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
        message: error.response?.data?.message || 'Failed to delete address'
      };
    }
  }

  // Set default address
  async setDefaultAddress(id: number): Promise<AddressResponse> {
    try {
      const token = AuthService.getToken();
      const response = await axios.post<AddressResponse>(
        `${this.baseUrl}/user/addresses/${id}/set-default`,
        {},
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
        message: error.response?.data?.message || 'Failed to set default address'
      };
    }
  }
}

export default new AddressService();