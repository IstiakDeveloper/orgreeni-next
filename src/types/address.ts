export interface Address {
    id?: number;
    user_id?: number;
    address_line: string;
    area: string;
    city: string;
    postal_code?: string;
    landmark?: string;
    is_default?: boolean;
    latitude?: number;
    longitude?: number;
    type?: 'home' | 'work' | 'other';
    contact_person_name?: string;
    contact_person_phone?: string;
  }
  
  export interface AddressResponse {
    success: boolean;
    message?: string;
    data?: {
      addresses?: Address[];
      address?: Address;
    };
  }