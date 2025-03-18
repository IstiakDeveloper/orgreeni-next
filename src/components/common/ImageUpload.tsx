import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload, X } from "lucide-react";

interface ImageUploadProps {
  currentImage: string | null;
  onImageUpload: (file: File | null) => void;
}

const ImageUpload: React.FC<ImageUploadProps> = ({ currentImage, onImageUpload }) => {
  const [preview, setPreview] = useState<string | null>(currentImage);
  const [isHovering, setIsHovering] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // currentImage প্রপ পরিবর্তন হলে প্রিভিউ আপডেট করুন
  React.useEffect(() => {
    setPreview(currentImage);
  }, [currentImage]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // প্রিভিউ তৈরি করুন
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      // প্যারেন্ট কম্পোনেন্টকে ফাইল ডাটা পাঠান
      onImageUpload(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleRemoveImage = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    onImageUpload(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={handleButtonClick}
          className="flex items-center gap-2"
        >
          <Upload size={16} />
          Select Image
        </Button>
        <Input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        
        {preview && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={handleRemoveImage}
          >
            <X size={16} className="mr-2" />
            Remove
          </Button>
        )}
      </div>
      
      {preview && (
        <div 
          className="relative w-48 h-48 border rounded-md overflow-hidden"
          onMouseEnter={() => setIsHovering(true)}
          onMouseLeave={() => setIsHovering(false)}
        >
          <img 
            src={preview} 
            alt="Preview" 
            className="w-full h-full object-cover"
          />
          {isHovering && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <Button 
                type="button" 
                variant="secondary" 
                size="sm"
                onClick={handleButtonClick}
              >
                Change
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;