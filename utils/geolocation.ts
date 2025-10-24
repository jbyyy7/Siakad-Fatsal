/**
 * Geolocation utilities for attendance validation
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface LocationValidationResult {
  isValid: boolean;
  distance?: number;
  error?: string;
}

/**
 * Get current user location using browser Geolocation API
 */
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation tidak didukung oleh browser Anda'));
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      (error) => {
        let errorMessage = 'Gagal mendapatkan lokasi';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Izin lokasi ditolak. Mohon aktifkan izin lokasi di browser Anda.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Informasi lokasi tidak tersedia';
            break;
          case error.TIMEOUT:
            errorMessage = 'Permintaan lokasi timeout';
            break;
        }
        reject(new Error(errorMessage));
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  });
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (coord1.latitude * Math.PI) / 180;
  const φ2 = (coord2.latitude * Math.PI) / 180;
  const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180;
  const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
}

/**
 * Validate if user is within allowed radius of target location
 */
export function validateLocation(
  userLocation: Coordinates,
  targetLocation: Coordinates,
  allowedRadius: number
): LocationValidationResult {
  if (!userLocation || !targetLocation) {
    return {
      isValid: false,
      error: 'Lokasi tidak valid',
    };
  }

  const distance = calculateDistance(userLocation, targetLocation);

  return {
    isValid: distance <= allowedRadius,
    distance: Math.round(distance),
  };
}

/**
 * Format distance for display
 */
export function formatDistance(meters: number): string {
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}

/**
 * Check if current time is within schedule time range
 */
export function isWithinScheduleTime(
  startTime: string,
  endTime: string,
  bufferMinutes = 15
): boolean {
  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();

  const [startHour, startMin] = startTime.split(':').map(Number);
  const [endHour, endMin] = endTime.split(':').map(Number);

  const scheduleStart = startHour * 60 + startMin - bufferMinutes;
  const scheduleEnd = endHour * 60 + endMin + bufferMinutes;

  return currentTime >= scheduleStart && currentTime <= scheduleEnd;
}

/**
 * Get current day of week (0-6, 0=Sunday)
 */
export function getCurrentDayOfWeek(): number {
  return new Date().getDay();
}

/**
 * Reverse geocoding - get address from coordinates (requires API key)
 * This is a placeholder - you can implement with Google Maps API or similar
 */
export async function getAddressFromCoordinates(
  coords: Coordinates
): Promise<string> {
  // Placeholder implementation
  return `${coords.latitude.toFixed(6)}, ${coords.longitude.toFixed(6)}`;
}
