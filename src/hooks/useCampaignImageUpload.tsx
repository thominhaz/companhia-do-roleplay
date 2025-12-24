import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';
import { compressImage } from '@/lib/imageCompression';

interface UploadOptions {
  folder: string;
  maxSizeKB?: number;
}

export function useCampaignImageUpload() {
  const { user } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File, options: UploadOptions): Promise<string | null> => {
    if (!user) {
      toast.error('Você precisa estar logado para enviar imagens');
      return null;
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Apenas imagens são permitidas');
      return null;
    }

    setIsUploading(true);
    setProgress(10);

    try {
      // Compress image if needed
      let processedFile: File = file;
      if (file.size > 500 * 1024) { // Compress if > 500KB
        setProgress(20);
        const compressed = await compressImage(file, options.maxSizeKB || 500);
        // Convert Blob back to File
        processedFile = new File([compressed], file.name, { 
          type: compressed.type,
          lastModified: Date.now() 
        });
      }

      setProgress(50);

      // Generate unique filename
      const fileExt = processedFile.name.split('.').pop() || 'jpg';
      const fileName = `${options.folder}/${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      setProgress(70);

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('campaign-images')
        .upload(fileName, processedFile, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      setProgress(90);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('campaign-images')
        .getPublicUrl(data.path);

      setProgress(100);
      
      return publicUrl;
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error('Erro ao enviar imagem: ' + error.message);
      return null;
    } finally {
      setIsUploading(false);
      setProgress(0);
    }
  };

  return {
    uploadImage,
    isUploading,
    progress,
  };
}
