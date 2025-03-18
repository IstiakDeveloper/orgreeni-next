import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/contexts/auth-context';
import { APP_CONFIG } from '@/config/constants';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = APP_CONFIG.adminRoles 
}) => {
  const { isAuthenticated, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }

    // Check user role if specific roles are required
    if (user && requiredRoles && !requiredRoles.includes(user.role)) {
      // Unauthorized role, redirect to dashboard or login
      router.replace('/dashboard');
      return;
    }
  }, [isAuthenticated, user, router, requiredRoles]);

  // Render children only if authenticated and role is correct
  return isAuthenticated ? <>{children}</> : null;
};