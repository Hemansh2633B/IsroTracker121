import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCoordinates(coordinates: string): string {
  return coordinates;
}

export function formatPercentage(value: number): string {
  return `${Math.round(value * 100)}%`;
}

export function formatDate(date: Date | string | null | undefined): string {
  if (!date) return 'Unknown';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  if (!(dateObj instanceof Date) || isNaN(dateObj.getTime())) {
    return 'Invalid date';
  }
  
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - dateObj.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Just now';
  if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hr ago`;
  return dateObj.toLocaleDateString();
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'active':
    case 'online':
    case 'complete':
      return 'text-green-800 bg-green-100';
    case 'forming':
    case 'processing':
    case 'running':
      return 'text-yellow-800 bg-yellow-100';
    case 'high risk':
    case 'error':
    case 'failed':
      return 'text-red-800 bg-red-100';
    case 'dissipating':
    case 'offline':
    case 'pending':
      return 'text-gray-800 bg-gray-100';
    default:
      return 'text-gray-800 bg-gray-100';
  }
}

export function getIntensityColor(intensity: string): string {
  switch (intensity?.toLowerCase()) {
    case 'high':
      return 'text-red-600';
    case 'moderate':
      return 'text-yellow-600';
    case 'low':
      return 'text-blue-600';
    default:
      return 'text-gray-600';
  }
}

export function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
}
