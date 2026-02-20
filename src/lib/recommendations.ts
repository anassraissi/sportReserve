/**
 * Recommendation Engine
 * Analyzes user booking history and provides intelligent suggestions
 */

export interface BookingPattern {
  preferredResourceType: string;
  preferredTimes: string[];
  preferredDays: string[];
  averageBookingDuration: number;
  frequencyPerMonth: number;
  totalSpent: number;
  favoriteLocations: string[];
}

/**
 * Analyze user's booking patterns
 */
export const analyzeBookingPatterns = (bookings: any[]): BookingPattern => {
  if (bookings.length === 0) {
    return {
      preferredResourceType: 'all',
      preferredTimes: [],
      preferredDays: [],
      averageBookingDuration: 0,
      frequencyPerMonth: 0,
      totalSpent: 0,
      favoriteLocations: []
    };
  }

  // Analyze resource types
  const typeCount: { [key: string]: number } = {};
  bookings.forEach(b => {
    const type = b.resourceId?.type || 'unknown';
    typeCount[type] = (typeCount[type] || 0) + 1;
  });

  const preferredResourceType = Object.entries(typeCount).sort(([, a], [, b]) => b - a)[0]?.[0] || 'all';

  // Analyze preferred times (hours)
  const hourCount: { [hour: number]: number } = {};
  bookings.forEach(b => {
    const hour = new Date(b.startTime).getHours();
    hourCount[hour] = (hourCount[hour] || 0) + 1;
  });

  const preferredTimes = Object.entries(hourCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([hour]) => {
      const h = parseInt(hour);
      return `${h}:00 - ${h + 1}:00`;
    });

  // Analyze preferred days
  const dayCount: { [key: string]: number } = {};
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  bookings.forEach(b => {
    const day = dayNames[new Date(b.startTime).getDay()];
    dayCount[day] = (dayCount[day] || 0) + 1;
  });

  const preferredDays = Object.entries(dayCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 2)
    .map(([day]) => day);

  // Calculate average duration
  const totalDuration = bookings.reduce((sum, b) => {
    const start = new Date(b.startTime).getTime();
    const end = new Date(b.endTime).getTime();
    return sum + (end - start) / (1000 * 60 * 60); // Convert to hours
  }, 0);
  const averageBookingDuration = Math.round(totalDuration / bookings.length * 10) / 10;

  // Calculate frequency per month
  const now = new Date();
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
  const recentBookings = bookings.filter(b => new Date(b.startTime) > threeMonthsAgo);
  const frequencyPerMonth = Math.round((recentBookings.length / 3) * 10) / 10;

  // Calculate total spent
  const totalSpent = bookings.reduce((sum, b) => {
    const amount = b.totalAmount || b.totalPrice || 0;
    return sum + amount;
  }, 0);

  // Favorite locations
  const locationCount: { [key: string]: number } = {};
  bookings.forEach(b => {
    const location = b.resourceId?.location || b.resourceId?.name || 'Unknown';
    locationCount[location] = (locationCount[location] || 0) + 1;
  });

  const favoriteLocations = Object.entries(locationCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([location]) => location);

  return {
    preferredResourceType,
    preferredTimes,
    preferredDays,
    averageBookingDuration,
    frequencyPerMonth,
    totalSpent,
    favoriteLocations
  };
};

/**
 * Get personalized recommendations
 */
export const getRecommendations = (
  pattern: BookingPattern,
  availableResources: any[],
  userBookings: any[]
): any[] => {
  if (availableResources.length === 0) return [];

  // Get already booked resource IDs
  const bookedResourceIds = new Set(userBookings.map(b => b.resourceId?._id || b.resourceId?.id));

  // Filter to same type and not already booked
  let recommendations = availableResources.filter(r => {
    const isSameType = pattern.preferredResourceType === 'all' || r.type === pattern.preferredResourceType;
    const notBooked = !bookedResourceIds.has(r._id || r.id);
    return isSameType && notBooked;
  });

  // Sort by rating (if available)
  recommendations.sort((a, b) => {
    const ratingA = a.averageRating || 0;
    const ratingB = b.averageRating || 0;
    return ratingB - ratingA;
  });

  return recommendations.slice(0, 5);
};

/**
 * Generate personalized message based on patterns
 */
export const generatePersonalizedMessage = (
  pattern: BookingPattern,
  userName: string
): string => {
  if (pattern.frequencyPerMonth === 0) {
    return `Bienvenue ${userName}! 👋 Commencez votre première réservation.`;
  }

  const messages = [];

  if (pattern.preferredTimes.length > 0) {
    messages.push(`✨ Vous réservez généralement entre ${pattern.preferredTimes[0]}`);
  }

  if (pattern.preferredDays.length > 0) {
    messages.push(`🗓️ Principalement les ${pattern.preferredDays.join(' et les ')}`);
  }

  if (pattern.averageBookingDuration > 0) {
    messages.push(`⏱️ Durée moyenne: ${pattern.averageBookingDuration}h`);
  }

  if (pattern.totalSpent > 0) {
    messages.push(`💰 Total dépensé: ${pattern.totalSpent.toLocaleString('fr-FR')} DH`);
  }

  return messages.join('\n');
};

/**
 * Get recommended time slots based on pattern
 */
export const getRecommendedTimeSlots = (pattern: BookingPattern): string[] => {
  if (pattern.preferredTimes.length === 0) {
    // Default suggestions
    return ['09:00 - 10:00', '14:00 - 15:00', '18:00 - 19:00'];
  }
  return pattern.preferredTimes;
};

/**
 * Track user interaction (for analytics)
 */
export interface UserInteraction {
  userId: string;
  resourceId: string;
  actionType: 'view' | 'book' | 'review' | 'wishlist';
  timestamp: Date;
  metadata?: {
    sessionDuration?: number;
    searchQuery?: string;
    source?: string;
  };
}

/**
 * Score resources based on user behavior
 */
export const scoreResourceForUser = (
  resource: any,
  pattern: BookingPattern,
  availableResources: any[]
): number => {
  let score = 0;

  // Type match
  if (resource.type === pattern.preferredResourceType) {
    score += 30;
  }

  // Rating
  if (resource.averageRating >= 4.5) {
    score += 25;
  } else if (resource.averageRating >= 4) {
    score += 15;
  }

  // Price range (estimate based on pattern)
  const estimatedBudget = pattern.totalSpent / Math.max(pattern.frequencyPerMonth, 1);
  const pricePerSession = resource.pricePerHour * pattern.averageBookingDuration;
  
  if (pricePerSession <= estimatedBudget * 1.2) {
    score += 20;
  }

  // Location match
  if (pattern.favoriteLocations.length > 0) {
    if (pattern.favoriteLocations.includes(resource.location || resource.name)) {
      score += 15;
    }
  }

  // Availability (if field exists)
  if (resource.isAvailable) {
    score += 10;
  }

  return score;
};

/**
 * Get trending resources (what similar users book)
 */
export const getTrendingResources = (
  resources: any[],
  pattern: BookingPattern
): any[] => {
  return resources
    .filter(r => r.type === pattern.preferredResourceType)
    .sort((a, b) => {
      const scoreA = scoreResourceForUser(a, pattern, resources);
      const scoreB = scoreResourceForUser(b, pattern, resources);
      return scoreB - scoreA;
    })
    .slice(0, 3);
};
