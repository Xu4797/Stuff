import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  
  // Check if user is authenticated
  const isAuthenticated = () => {
    const token = localStorage.getItem('academic_token');
    const username = localStorage.getItem('academic_user');
    
    if (!token || !username) {
      return false;
    }
    
    // Token validation (supports both JWT and simple base64 tokens)
    try {
      let payload;
      
      // Check if it's a JWT token (has 3 parts separated by dots)
      if (token.split('.').length === 3) {
        // JWT format
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
          atob(base64)
            .split('')
            .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
        );
        payload = JSON.parse(jsonPayload);
      } else {
        // Simple base64 encoded JSON (Edge Functions compatible)
        payload = JSON.parse(atob(token));
      }
      
      const currentTime = Math.floor(Date.now() / 1000);
      
      // Check if token is expired
      if (payload.exp && payload.exp < currentTime * 1000) { // exp is in milliseconds for our simple token
        // Token expired, clear storage
        localStorage.removeItem('academic_token');
        localStorage.removeItem('academic_user');
        return false;
      }
      
      return true;
    } catch (error) {
      // If token is invalid, clear storage
      console.error('Token validation error:', error);
      localStorage.removeItem('academic_token');
      localStorage.removeItem('academic_user');
      return false;
    }
  };

  if (!isAuthenticated()) {
    // Redirect to login page with return url
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
