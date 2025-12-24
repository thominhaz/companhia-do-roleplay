/**
 * Compresses an image file to reduce storage usage
 * @param file - The original image file
 * @param maxWidth - Maximum width (default: 512px for avatars)
 * @param maxHeight - Maximum height (default: 512px for avatars)
 * @param quality - JPEG/WebP quality 0-1 (default: 0.8)
 * @returns Compressed image as Blob
 */
export const compressImage = async (
  file: File,
  maxWidth: number = 512,
  maxHeight: number = 512,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = img;
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      // Create canvas and draw resized image
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to blob (prefer WebP, fallback to JPEG)
      const outputType = 'image/webp';
      
      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`Image compressed: ${(file.size / 1024).toFixed(1)}KB → ${(blob.size / 1024).toFixed(1)}KB`);
            resolve(blob);
          } else {
            // Fallback to JPEG if WebP fails
            canvas.toBlob(
              (jpegBlob) => {
                if (jpegBlob) {
                  resolve(jpegBlob);
                } else {
                  reject(new Error('Failed to compress image'));
                }
              },
              'image/jpeg',
              quality
            );
          }
        },
        outputType,
        quality
      );
    };

    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
};

/**
 * Gets the file extension for a blob based on its type
 */
export const getExtensionFromBlob = (blob: Blob): string => {
  const mimeToExt: Record<string, string> = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
  };
  return mimeToExt[blob.type] || 'jpg';
};
