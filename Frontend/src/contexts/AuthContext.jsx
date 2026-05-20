import React, { createContext, useContext, useState, useEffect } from 'react';
import { API_ENDPOINTS } from '../config/config.js';

// Create the Auth Context
const AuthContext = createContext();

// AuthProvider component to wrap around our app
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
    // Check if user is already logged in on app load
  useEffect(() => {
    const checkLoggedIn = async () => {
      if (token) {
        try {
          const response = await fetch(API_ENDPOINTS.AUTH.PROFILE, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();            // Handle nested response structure from the /me endpoint
            if (data.success && data.data && data.data.user) {
              // Create normalized user object with consistent role casing
              const normalizedUser = {
                ...data.data.user,
                role: data.data.user.role ? data.data.user.role.toLowerCase() : 'user'
              };
              console.log('Profile data normalized:', normalizedUser);
              setCurrentUser(normalizedUser);
            } else {
              console.error('Unexpected profile response structure:', data);
              localStorage.removeItem('token');
              setToken(null);
            }
          } else {
            // If token is invalid, clear it
            localStorage.removeItem('token');
            setToken(null);
          }
        } catch (err) {
          console.error('Error checking authentication status:', err);
          // Clear token on error as a precaution
          localStorage.removeItem('token');
          setToken(null);
        }
      }
      
      setLoading(false);
    };
    
    checkLoggedIn();
  }, [token]);
  
  // Login function
  const login = async (email, password) => {
    setLoading(true);
    setError(null);
    
    try {
      const credentials = { identifier: email, password };
      console.log('Login credentials:', JSON.stringify(credentials));
      
      const response = await fetch(API_ENDPOINTS.AUTH.LOGIN, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      let data;
      try {
        data = await response.json();
        console.log('Full login response:', data);
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        throw new Error('Invalid response from server');
      }
        if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
        // Save the token to localStorage
      if (data.data && data.data.token) {
        console.log('Login user data:', data.data.user);
        
        // Create a normalized user object with standardized role casing
        const normalizedUser = {
          ...data.data.user,
          // Ensure role is lowercase for consistent comparison
          role: data.data.user.role ? data.data.user.role.toLowerCase() : 'user'
        };
        
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        setCurrentUser(normalizedUser);
        return normalizedUser;
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid response structure from server');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.REGISTER, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
        if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }
      
      // Save the token to localStorage
      if (data.data && data.data.token) {
        localStorage.setItem('token', data.data.token);
        setToken(data.data.token);
        setCurrentUser(data.data.user);
        return data.data.user;
      } else {
        console.error('Unexpected response structure:', data);
        throw new Error('Invalid response structure from server');
      }
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Logout function
  const logout = async () => {
    try {
      // Call logout endpoint if server needs to invalidate the token
      if (token) {
        await fetch(API_ENDPOINTS.AUTH.LOGOUT, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      // Clear local storage and state
      localStorage.removeItem('token');
      setToken(null);
      setCurrentUser(null);
    }
  };
  
  // Function to update user profile
  const updateProfile = async (profileData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.USER.UPDATE_PROFILE, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(profileData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Profile update failed');
      }
      
      setCurrentUser(prevUser => ({
        ...prevUser,
        ...data
      }));
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to change password
  const changePassword = async (passwordData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.USER.CHANGE_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(passwordData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password change failed');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Function for forgot password
  const forgotPassword = async (email) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.FORGOT_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset request failed');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  // Function for resetting password
  const resetPassword = async (token, newPassword) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(API_ENDPOINTS.AUTH.RESET_PASSWORD, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, newPassword })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Password reset failed');
      }
      
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  // Value object to be provided to consumers
  const value = {
    currentUser,
    user: currentUser, // Add this for backward compatibility
    loading,
    error,
    token,
    isAuthenticated: !!currentUser,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
    forgotPassword,
    resetPassword
  };
  
  // Debug authentication state
  useEffect(() => {
    console.log('Auth state updated:', { 
      isAuthenticated: !!currentUser, 
      role: currentUser?.role,
      token: !!token 
    });
  }, [currentUser, token]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
