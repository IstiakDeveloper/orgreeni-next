import React, { useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { useAddresses } from '@/hooks/use-addresses';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, MapPin, Trash2, Edit } from 'lucide-react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AddressesPage() {
  const {
    addresses, 
    isLoading, 
    addAddress, 
    updateAddress, 
    deleteAddress, 
    setDefaultAddress
  } = useAddresses();

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);

  const handleAddressSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const addressData = {
      address_line: formData.get('address_line') as string,
      area: formData.get('area') as string,
      city: formData.get('city') as string,
      postal_code: formData.get('postal_code') as string,
      landmark: formData.get('landmark') as string,
    };

    if (editingAddress) {
      // Update existing address
      await updateAddress(editingAddress.id, addressData);
    } else {
      // Add new address
      await addAddress(addressData);
    }

    // Close dialog and reset editing state
    setIsAddDialogOpen(false);
    setEditingAddress(null);
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>My Addresses</CardTitle>
              <Button 
                onClick={() => {
                  setEditingAddress(null);
                  setIsAddDialogOpen(true);
                }}
              >
                Add New Address
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center items-center">
                <Loader2 className="animate-spin" />
              </div>
            ) : (
              <div className="space-y-4">
                {addresses.map((address) => (
                  <div 
                    key={address.id} 
                    className={`
                      border p-4 rounded-lg flex justify-between items-center
                      ${address.is_default ? 'border-primary bg-primary/10' : ''}
                    `}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <MapPin className="text-primary" />
                        <span className="font-semibold">{address.address_line}</span>
                        {address.is_default && (
                          <span className="text-xs bg-primary text-white px-2 py-1 rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-muted-foreground">
                        {address.area}, {address.city} {address.postal_code}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {!address.is_default && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setDefaultAddress(address.id!)}
                        >
                          Set as Default
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="icon"
                        onClick={() => {
                          setEditingAddress(address);
                          setIsAddDialogOpen(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="icon"
                        onClick={() => deleteAddress(address.id!)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Add/Edit Address Dialog */}
        <Dialog 
          open={isAddDialogOpen} 
          onOpenChange={(open) => {
            setIsAddDialogOpen(open);
            if (!open) setEditingAddress(null);
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddressSubmit} className="space-y-4">
              <div>
                <Label>Address Line</Label>
                <Input 
                  name="address_line" 
                  defaultValue={editingAddress?.address_line || ''}
                  required 
                />
              </div>
              <div>
                <Label>Area</Label>
                <Input 
                  name="area" 
                  defaultValue={editingAddress?.area || ''}
                  required 
                />
              </div>
              <div>
                <Label>City</Label>
                <Input name="city" 
                  defaultValue={editingAddress?.city || ''}
                  required 
                />
              </div>
              <div>
                <Label>Postal Code</Label>
                <Input 
                  name="postal_code" 
                  defaultValue={editingAddress?.postal_code || ''}
                />
              </div>
              <div>
                <Label>Landmark (Optional)</Label>
                <Input 
                  name="landmark" 
                  defaultValue={editingAddress?.landmark || ''}
                />
              </div>
              <Button type="submit" className="w-full">
                {editingAddress ? 'Update Address' : 'Add Address'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </ProtectedRoute>
  );
}