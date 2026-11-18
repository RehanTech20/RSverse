/**
 * Compresses an uploaded image file client-side using an HTML5 Canvas
 * to reduce upload payload size and speed up Memories / Avatar saves.
 */
export async function compressImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.85
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Please choose a valid image file (PNG, JPEG, WEBP, or GIF).');
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error('Selected image is too large (max 12MB before compression).');
  }

  // Keep animated GIFs or very small files (< 180KB) untouched
  if (file.type === 'image/gif' || file.size < 180 * 1024) {
    return await readAsDataUrl(file);
  }

  const dataUrl = await readAsDataUrl(file);
  const img = await loadImage(dataUrl);

  let { width, height } = img;
  if (width > maxDimension || height > maxDimension) {
    if (width >= height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, width);
  canvas.height = Math.max(1, height);
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  // Prefer JPEG for photographs (or PNG if transparency-sensitive PNG was small)
  const outputType = file.type === 'image/png' ? 'image/webp' : 'image/jpeg';
  const compressed = canvas.toDataURL(outputType, quality);

  // Fallback to original if canvas encoding unexpectedly grew or failed
  if (!compressed.startsWith('data:image/') || compressed.length > dataUrl.length) {
    return dataUrl;
  }
  return compressed;
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Could not read the selected image.'));
    reader.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not decode the selected image.'));
    img.src = src;
  });
}
