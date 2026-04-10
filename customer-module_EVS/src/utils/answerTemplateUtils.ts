export function convertGoogleDriveLink(url: string): string {
  if (!url || typeof url !== 'string') {
    return url;
  }

  const trimmed = url.trim();
  
  const fileIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (fileIdMatch && fileIdMatch[1]) {
    const fileId = fileIdMatch[1];
    return `https://drive.google.com/uc?export=view&id=${fileId}`;
  }
  
  return trimmed;
}

export function isImageUrl(url: string): boolean {
  if (!url || typeof url !== 'string') {
    return false;
  }

  const trimmed = url.trim().toLowerCase();
  
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
  if (imageExtensions.some(ext => trimmed.endsWith(ext))) {
    return true;
  }
  
  if (trimmed.includes('drive.google.com')) {
    return true;
  }
  
  if (trimmed.includes('imgur.com') || trimmed.includes('cloudinary.com') || 
      trimmed.includes('s3.amazonaws.com') || trimmed.includes('cdn.')) {
    return true;
  }
  
  return false;
}
