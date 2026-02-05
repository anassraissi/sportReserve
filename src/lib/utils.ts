import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Get image URL - handles both absolute URLs and relative paths
export function getImageUrl(url?: string | null): string {
  if (!url) return '/placeholder.svg';
  
  // If already a full URL, return as is
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // For relative paths, prepend the server URL
  const serverUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  return `${serverUrl}${url.startsWith('/') ? url : `/${url}`}`;
}