// src/components/brands/BrandForm.tsx
import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  ImagePlus, 
  Trash2 
} from 'lucide-react';
import { Brand } from '@/types/brand';
import { toast } from 'sonner';

interface BrandFormProps {
  isOpen: boolean;
  onClose: () => void;
  brand?: Brand | null;
  onSubmit: (brandData: FormData) => Promise<boolean>;
}

export function BrandForm({ 
  isOpen, 
  onClose, 
  brand = null, 
  onSubmit 
}: BrandFormProps) {
  const [name, setName] = useState(brand?.name || '');
  const [slug, setSlug] = useState(brand?.slug || '');
  const [description, setDescription] = useState(brand?.description || '');
  const [isActive, setIsActive] = useState(brand?.is_active ?? true);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(
    brand?.logo ? `${process.env.NEXT_PUBLIC_STORAGE_URL}/${brand.logo}` : null
  );

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogo(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleRemoveLogo = () => {
    setLogo(null);
    setLogoPreview(null);
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!name.trim()) {
      toast.error('Brand name is required');
      return;
    }

    // Prepare form data
    const formData = new FormData();
    formData.append('name', name);
    formData.append('slug', slug || generateSlug(name));
    formData.append('description', description);
    formData.append('is_active', isActive.toString());

    if (logo) {
      formData.append('logo', logo);
    }

    // Submit form
    try {
      const success = await onSubmit(formData);
      if (success) {
        onClose();
      }
    } catch (error) {
      toast.error('Failed to save brand');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {brand ? 'Edit Brand' : 'Create New Brand'}
          </DialogTitle>
          <DialogDescription>
            {brand 
              ? 'Update the details of an existing brand' 
              : 'Create a new brand for your store'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Brand Name */}
            <div className="space-y-2">
              <Label>Brand Name</Label>
              <Input 
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  // Auto-generate slug if not manually edited
                  if (!slug) {
                    setSlug(generateSlug(e.target.value));
                  }
                }}
                placeholder="Enter brand name"
                required 
              />
            </div>

            {/* Brand Slug */}
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input 
                value={slug}
                onChange={(e) => setSlug(generateSlug(e.target.value))}
                placeholder="brand-slug"
                required 
              />
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <Textarea 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the brand"
              rows={3}
            />
          </div>

          {/* Logo Upload */}
          <div className="space-y-2">
            <Label>Brand Logo</Label>
            <div className="flex items-center space-x-4">
              <input 
                type="file" 
                accept="image/*" 
                onChange={handleLogoChange}
                className="hidden" 
                id="logo-upload"
              />
              <label 
                htmlFor="logo-upload" 
                className="cursor-pointer"
              >
                {logoPreview ? (
                  <div className="relative">
                    <img 
                      src={logoPreview} 
                      alt="Brand Logo" 
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                    <button 
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="w-24 h-24 border-2 border-dashed rounded-lg flex items-center justify-center">
                    <ImagePlus className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </label>
            </div>
          </div>

          {/* Active Status */}
          <div className="flex items-center space-x-2">
            <Switch 
              checked={isActive}
              onCheckedChange={setIsActive}
            />
            <Label>Active Brand</Label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button type="submit">
              {brand ? 'Update Brand' : 'Create Brand'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}