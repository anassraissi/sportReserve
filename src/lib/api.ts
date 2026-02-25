const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token
const getToken = (): string | null => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = getToken();
  
  const headers: HeadersInit = {
    ...options.headers,
  };

  // Don't set Content-Type for FormData (file uploads)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    // Handle 401 Unauthorized - token expired or invalid
    if (response.status === 401) {
      // Only clear and redirect if not already on auth pages and not during login/register
      const isAuthPage = window.location.pathname === '/login' || window.location.pathname === '/register';
      const isAuthEndpoint = endpoint.includes('/auth/login') || endpoint.includes('/auth/register');
      const isGetCurrentUser = endpoint.includes('/auth/me');
      
      // Don't redirect if it's a getCurrentUser call - just throw error (don't clear token)
      if (isGetCurrentUser) {
        const error = await response.json().catch(() => ({ message: 'Invalid token' }));
        throw new Error(error.message || 'Invalid token');
      }
      
      // For other endpoints, be more careful about redirecting
      if (!isAuthPage && !isAuthEndpoint) {
        // Don't redirect immediately - let the app handle it
        // Only clear token if we're sure it's invalid
        const errorData = await response.json().catch(() => ({ message: 'Unauthorized' }));
        if (errorData.message?.includes('Invalid token') || errorData.message?.includes('Token expired')) {
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setTimeout(() => {
            if (window.location.pathname !== '/login' && window.location.pathname !== '/register') {
              window.location.href = '/login';
            }
          }, 500);
        }
      }
    }
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    
    // Create error object with validation errors if they exist
    const errorObj: any = new Error(error.message || `HTTP error! status: ${response.status}`);
    if (error.errors) {
      errorObj.errors = error.errors;
    }
    throw errorObj;
  }

  return response.json();
};



// Auth API
export const authAPI = {
  register: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: 'user' | 'admin';
  }) => {
    return apiRequest<{ token: string; user: any; message: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  registerWithGoogle: async (data: {
    googleId: string;
    email: string;
    firstName: string;
    lastName: string;
    googleProfilePicture?: string;
  }) => {
    return apiRequest<{ user: any; userId: string; message: string; requiresVerification: boolean }>('/auth/register-google', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  verifyEmailCode: async (email: string, verificationCode: string) => {
    return apiRequest<{ token: string; user: any; message: string }>('/auth/verify-email-code', {
      method: 'POST',
      body: JSON.stringify({ email, verificationCode }),
    });
  },

  setPassword: async (password: string) => {
    return apiRequest<{ message: string }>('/auth/set-password', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });
  },

  login: async (email: string, password: string) => {
    return apiRequest<{ token: string; user: any; message: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  loginWithGoogle: async (credential: string) => {
    return apiRequest<{ token: string; user: any; message: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify({ credential }),
    });
  },

  getCurrentUser: async () => {
    return apiRequest<{ user: any }>('/auth/me');
  },

  updateProfile: async (data: { firstName?: string; lastName?: string; phone?: string }) => {
    return apiRequest<{ user: any; message: string }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  uploadAvatar: async (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiRequest<{ avatar: string; avatarUrl: string; message: string }>('/auth/avatar', {
      method: 'POST',
      body: formData,
    });
  },

  changePassword: async (data: { 
    currentPassword: string; 
    newPassword: string;
    confirmPassword: string;
  }) => {
    return apiRequest<{ message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPendingRegistrations: async () => {
    return apiRequest<{ users: any[] }>('/auth/admin/pending-registrations');
  },

  approveUser: async (userId: string) => {
    return apiRequest<{ user: any; message: string }>(`/auth/admin/approve-user/${userId}`, {
      method: 'POST',
    });
  },

  rejectUser: async (userId: string) => {
    return apiRequest<{ user: any; message: string }>(`/auth/admin/reject-user/${userId}`, {
      method: 'POST',
    });
  },
};

// Resources API
export const resourcesAPI = {
  getAll: async (params?: {
    type?: string;
    categoryId?: string;
    locationId?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
    managerId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ resources: any[]; pagination: any }>(`/resources?${queryParams}`);
  },

  search: async (q: string, type?: string, locationId?: string) => {
    const queryParams = new URLSearchParams({ q });
    if (type) queryParams.append('type', type);
    if (locationId) queryParams.append('locationId', locationId);
    return apiRequest<{ resources: any[] }>(`/resources/search?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest<{ resource: any }>(`/resources/${id}`);
  },

  create: async (data: any) => {
    return apiRequest<{ resource: any; message: string }>('/resources', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest<{ resource: any; message: string }>(`/resources/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/resources/${id}`, {
      method: 'DELETE',
    });
  },

  getCategories: async () => {
    return apiRequest<{ categories: any[] }>('/resources/categories/all');
  },

  getEquipment: async (resourceId: string) => {
    return apiRequest<{ equipment: any[] }>(`/resources/${resourceId}/equipment`);
  },
};

// Locations API
export const locationsAPI = {
  getAll: async (params?: { active?: boolean }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ locations: any[] }>(`/locations?${queryParams}`);
  },

  create: async (data: {
    name: string;
    address: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    timezone?: string;
    isActive?: boolean;
  }) => {
    return apiRequest<{ location: any; message: string }>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Weather API
export const weatherAPI = {
  getRegions: async () => {
    return apiRequest<{ regions: any[]; updatedAt: string }>(`/weather/regions`);
  },
};

// Bookings API
export const bookingsAPI = {
  getAll: async (params?: {
    status?: string;
    resourceId?: string;
    userId?: string;
    page?: number;
    limit?: number;
    admin?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ reservations: any[]; pagination: any }>(`/bookings?${queryParams}`);
  },

  getRecommendations: async (params?: {
    scope?: 'upcoming' | 'all';
    days?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ recommendations: any[] }>(`/bookings/recommendations?${queryParams}`);
  },

  getRecommendation: async (reservationId: string) => {
    return apiRequest<{ reservationId: string; recommendation: any }>(`/bookings/${reservationId}/recommendation`);
  },

  getById: async (id: string) => {
    return apiRequest<{ reservation: any }>(`/bookings/${id}`);
  },

  checkAvailability: async (resourceId: string, startTime: string, endTime: string) => {
    return apiRequest<{ available: boolean; conflicts: number; conflictingReservations: any[] }>(
      `/bookings/availability/${resourceId}?startTime=${startTime}&endTime=${endTime}`
    );
  },

  create: async (data: {
    resourceId: string;
    startTime: string;
    endTime: string;
    title?: string;
    description?: string;
    attendeesCount?: number;
    specialRequests?: string;
  }) => {
    return apiRequest<{ reservation: any; message: string }>('/bookings', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: any) => {
    return apiRequest<{ reservation: any; message: string }>(`/bookings/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  cancel: async (id: string, reason?: string) => {
    return apiRequest<{ reservation: any; message: string }>(`/bookings/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  checkIn: async (id: string) => {
    return apiRequest<{ reservation: any; message: string }>(`/bookings/${id}/check-in`, {
      method: 'POST',
    });
  },

  checkOut: async (id: string) => {
    return apiRequest<{ reservation: any; message: string }>(`/bookings/${id}/check-out`, {
      method: 'POST',
    });
  },

  processPayment: async (id: string, data: {
    amount: number;
    currency: string;
    cardDetails: {
      number: string;
      exp_month: number;
      exp_year: number;
      cvc: string;
      name: string;
    };
    reservationId: string;
  }) => {
    return apiRequest<{ success: boolean; message: string; paymentId?: string; reservation?: any }>(`/bookings/${id}/payment`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPaymentStatus: async (id: string) => {
    return apiRequest<{ paymentStatus: string; paymentId: string; reservation: any }>(`/bookings/${id}/payment-status`);
  },
};

// Media API
export const mediaAPI = {
  upload: async (file: File, data?: {
    resourceId?: string;
    mediaType?: string;
    purpose?: string;
    category?: string;
    description?: string;
    altText?: string;
  }) => {
    const formData = new FormData();
    formData.append('file', file);
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, String(value));
      });
    }

    return apiRequest<{ mediaAsset: any; message: string }>('/media/upload', {
      method: 'POST',
      body: formData,
    });
  },

  uploadBatch: async (files: File[], data?: {
    resourceId?: string;
    mediaType?: string;
    purpose?: string;
  }) => {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));
    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, String(value));
      });
    }

    return apiRequest<{ mediaAssets: any[]; message: string }>('/media/upload/batch', {
      method: 'POST',
      body: formData,
    });
  },

  getById: async (id: string) => {
    return apiRequest<{ mediaAsset: any }>(`/media/${id}`);
  },

  getByResource: async (resourceId: string, params?: {
    mediaType?: string;
    purpose?: string;
    isApproved?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ mediaAssets: any[] }>(`/media/resource/${resourceId}?${queryParams}`);
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/media/${id}`, {
      method: 'DELETE',
    });
  },
};

// Admin API
export const adminAPI = {
  createUser: async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
    phone?: string;
  }) => {
    return apiRequest<{ user: any; message: string }>('/auth/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getUsers: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ users: any[]; pagination: any }>(`/auth/users?${queryParams}`);
  },

  updateUser: async (id: string, data: {
    firstName?: string;
    lastName?: string;
    role?: string;
    phone?: string;
    isActive?: boolean;
  }) => {
    return apiRequest<{ user: any; message: string }>(`/auth/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteUser: async (id: string) => {
    return apiRequest<{ message: string }>(`/auth/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Notifications API
export const notificationsAPI = {
  getAll: async (params?: {
    status?: string;
    type?: string;
    unread?: boolean;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ notifications: any[]; unreadCount: number; pagination: any }>(
      `/notifications?${queryParams}`
    );
  },

  getById: async (id: string) => {
    return apiRequest<{ notification: any }>(`/notifications/${id}`);
  },

  markAsRead: async (id: string) => {
    return apiRequest<{ notification: any; message: string }>(`/notifications/${id}/read`, {
      method: 'POST',
    });
  },

  markAllAsRead: async () => {
    return apiRequest<{ message: string; count: number }>('/notifications/read-all', {
      method: 'POST',
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },

  broadcastAll: async (data: {
    title: string;
    message: string;
    type?: string;
    channels?: string[];
    userRole?: string;
  }) => {
    return apiRequest<{ message: string; count: number; notifications: any[] }>(
      '/notifications/broadcast/all',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  sendToUser: async (userId: string, data: {
    title: string;
    message: string;
    type?: string;
    channels?: string[];
  }) => {
    return apiRequest<{ message: string; notifications: any[] }>(
      `/notifications/send/${userId}`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },

  create: async (data: {
    userId: string;
    title: string;
    message: string;
    type?: string;
    channel?: string;
  }) => {
    return apiRequest<{ message: string; notification: any }>(
      '/notifications',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  },
};

// ===================================================
// REVIEWS API
export const reviewsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    resourceId?: string;
    userId?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) queryParams.append(key, String(value));
      });
    }
    return apiRequest<{ reviews: any[]; pagination: any }>(`/reviews?${queryParams}`);
  },

  getById: async (id: string) => {
    return apiRequest<{ review: any }>(`/reviews/${id}`);
  },

  create: async (data: {
    reservationId?: string;
    resourceId: string;
    rating: number;
    comment: string;
  }) => {
    return apiRequest<{ review: any; message: string }>('/reviews', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  update: async (id: string, data: {
    rating?: number;
    comment?: string;
  }) => {
    return apiRequest<{ review: any; message: string }>(`/reviews/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  delete: async (id: string) => {
    return apiRequest<{ message: string }>(`/reviews/${id}`, {
      method: 'DELETE',
    });
  },
};

// Export default API object
export default {
  auth: authAPI,
  resources: resourcesAPI,
  bookings: bookingsAPI,
  media: mediaAPI,
  notifications: notificationsAPI,
  reviews: reviewsAPI,
};

