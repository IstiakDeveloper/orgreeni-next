import { useState, useEffect } from 'react';
import { Address } from '@/types/address';
import AddressService from '@/services/address-service';
import { toast } from 'sonner';

export function useAddresses() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch addresses
  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await AddressService.getAddresses();
      
      if (response.success && response.data?.addresses) {
        setAddresses(response.data.addresses);
        setError(null);
      } else {
        setError(response.message || 'Failed to fetch addresses');
      }
    } catch (err) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  // Add new address
  const addAddress = async (addressData: Address) => {
    try {
      const response = await AddressService.addAddress(addressData);
      
      if (response.success && response.data?.address) {
        setAddresses(prev => [...prev, response.data.address!]);
        toast.success('Address added successfully');
        return true;
      } else {
        toast.error(response.message || 'Failed to add address');
        return false;
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Update address
  const updateAddress = async (id: number, addressData: Address) => {
    try {
      const response = await AddressService.updateAddress(id, addressData);
      
      if (response.success && response.data?.address) {
        setAddresses(prev => 
          prev.map(addr => addr.id === id ? response.data!.address! : addr)
        );
        toast.success('Address updated successfully');
        return true;
      } else {
        toast.error(response.message || 'Failed to update address');
        return false;
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Delete address
  const deleteAddress = async (id: number) => {
    try {
      const response = await AddressService.deleteAddress(id);
      
      if (response.success) {
        setAddresses(prev => prev.filter(addr => addr.id !== id));
        toast.success('Address deleted successfully');
        return true;
      } else {
        toast.error(response.message || 'Failed to delete address');
        return false;
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Set default address
  const setDefaultAddress = async (id: number) => {
    try {
      const response = await AddressService.setDefaultAddress(id);
      
      if (response.success) {
        // Update addresses to reflect new default
        setAddresses(prev => 
          prev.map(addr => ({
            ...addr, 
            is_default: addr.id === id
          }))
        );
        toast.success('Default address updated successfully');
        return true;
      } else {
        toast.error(response.message || 'Failed to set default address');
        return false;
      }
    } catch (err) {
      toast.error('An unexpected error occurred');
      return false;
    }
  };

  // Initial fetch on hook mount
  useEffect(() => {
    fetchAddresses();
  }, []);

  return {
    addresses,
    isLoading,
    error,
    fetchAddresses,
    addAddress,
    updateAddress,
    deleteAddress,
    setDefaultAddress
  };
}