import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { User } from '@/types/reservation';
import { authAPI } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  loginWithGoogle?: (credential: string) => Promise<boolean>;
}

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role?: 'user' | 'admin';
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Try to load user from localStorage first
    const stored = localStorage.getItem('currentUser');
    const token = localStorage.getItem('token');
    if (stored && token) {
      try {
        const parsed = JSON.parse(stored);
        // Ensure the parsed user has required fields
        if (parsed && parsed.id && parsed.email) {
          return parsed;
        }
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState(!user); // Start as false if user is loaded from localStorage

  // Only verify token on mount if we DON'T have a user in localStorage
  useEffect(() => {
    // If user is already loaded from localStorage, we're done
    if (user) {
      setIsLoading(false);
      return;
    }

    // No user in state, check if we have token
    const token = localStorage.getItem('token');
    if (!token) {
      setIsLoading(false);
      return;
    }

    // We have a token but no user in state - try to load user
    // But do this in background without blocking
    setIsLoading(true);
    authAPI.getCurrentUser()
      .then((response) => {
        const userData = response.user;
        const userObj = {
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role,
          avatar: userData.avatar,
          avatarUrl: userData.avatarUrl,
          createdAt: new Date(userData.createdAt),
        };
        setUser(userObj);
        localStorage.setItem('currentUser', JSON.stringify(userObj));
      })
      .catch((error) => {
        console.error('Failed to load user from token:', error);
        // Don't clear token immediately - might be a network issue
        // Only clear if we're sure it's an invalid token
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('Invalid token') && !errorMessage.includes('401')) {
          // Only clear on explicit "Invalid token" message, not on 401 (might be network)
          localStorage.removeItem('token');
          localStorage.removeItem('currentUser');
          setUser(null);
        }
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []); // Only run once on mount

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authAPI.login(email, password);
      const userData = response.user;
      
      // Create user object
      const userObj = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        avatar: userData.avatar,
        avatarUrl: userData.avatarUrl,
        createdAt: new Date(userData.createdAt),
      };
      
      // Store token and user atomically
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      setUser(userObj);
      setIsLoading(false);
      
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      setIsLoading(false);
      throw error; // Re-throw to let the component handle the error message
    }
  }, []);

  const register = useCallback(async (data: RegisterData): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authAPI.register(data);
      const userData = response.user;
      
      // Create user object
      const userObj = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        avatar: userData.avatar,
        avatarUrl: userData.avatarUrl,
        createdAt: new Date(userData.createdAt),
      };
      
      // Store token and user atomically
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      setUser(userObj);
      setIsLoading(false);
      
      return true;
    } catch (error: any) {
      console.error('Register error:', error);
      setIsLoading(false);
      throw error; // Re-throw to let the component handle the error message
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
  }, []);

  const loginWithGoogle = useCallback(async (credential: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await authAPI.loginWithGoogle(credential);
      const userData = response.user;
      const userObj = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        avatar: userData.avatar,
        avatarUrl: userData.avatarUrl,
        createdAt: new Date(userData.createdAt),
      };
      localStorage.setItem('token', response.token);
      localStorage.setItem('currentUser', JSON.stringify(userObj));
      setUser(userObj);
      setIsLoading(false);
      return true;
    } catch (error: any) {
      setIsLoading(false);
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      loginWithGoogle,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
