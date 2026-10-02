import React, { useRef, useState } from 'react';
import { Image as ImageIcon, Loader2 } from 'lucide-react';
import { Axios } from '@/base-axios';
import { toast } from '@/utils/toast';

interface ImageUploadButtonProps {
  onImageUploaded: (url: string, altText?: string) => void;
  disabled?: boolean;
}

export const ImageUploadButton: React.FC<ImageUploadButtonProps> = ({
  onImageUploaded,
  disabled = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate size (max 5MB)
    const MAX_SIZE_BYTES = 5 * 1024 * 1024;
    if (file.size > MAX_SIZE_BYTES) {
      toast.error('Image size must be less than 5MB');
      e.target.value = '';
      return;
    }

    // Validate format
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Please upload a valid image file (JPEG, PNG, WebP, SVG)');
      e.target.value = '';
      return;
    }

    try {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      // Call image upload API
      const response = await Axios.post('/admin/exam-manager/upload-question-image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const imageUrl = response.data?.data?.url || response.data?.url;
      if (imageUrl) {
        onImageUploaded(imageUrl, file.name.replace(/\.[^/.]+$/, ''));
        toast.success('Image uploaded successfully');
      } else {
        // Fallback: Read as data URL if server returns non-standard format
        const reader = new FileReader();
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            onImageUploaded(reader.result, file.name);
          }
        };
        reader.readAsDataURL(file);
      }
    } catch (err: any) {
      console.warn('Image upload failed, falling back to inline data URL preview:', err);
      // Client-side fallback for development or before backend upload route is active
      const reader = new FileReader();
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          onImageUploaded(reader.result, file.name);
          toast.success('Image attached locally');
        }
      };
      reader.readAsDataURL(file);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/jpeg,image/png,image/webp,image/svg+xml"
        className="hidden"
      />
      <button
        type="button"
        disabled={disabled || isUploading}
        onClick={() => fileInputRef.current?.click()}
        className={`p-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
          isUploading
            ? 'bg-indigo-50 text-indigo-500 cursor-wait'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-50'
        }`}
        title="Upload Image/Diagram (max 5MB)"
      >
        {isUploading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <ImageIcon className="w-4 h-4 text-indigo-600" />
        )}
        <span className="hidden sm:inline">Image</span>
      </button>
    </>
  );
};
