import { ReactNode, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';

type ProtectedRouteProps = {
  children: ReactNode;
  requiredRoles?: string[];
};

export const ProtectedRoute = ({ children, requiredRoles = [] }: ProtectedRouteProps) => {
  const { user, loading, checkAuth } = useAuth();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const verifyAuth = async () => {
      const isAuthenticated = await checkAuth();
      
      if (!isAuthenticated) {
        navigate('/login', { state: { from: location }, replace: true });
        return;
      }

      // Check roles if required
      if (requiredRoles.length > 0 && user) {
        const hasRequiredRole = requiredRoles.some(role => 
          user.roles?.includes(role)
        );
        
        if (!hasRequiredRole) {
          navigate('/unauthorized', { replace: true });
          return;
        }
      }

      setIsAuthorized(true);
    };

    verifyAuth();
  }, [checkAuth, location, navigate, requiredRoles, user]);

  if (loading || isAuthorized === null) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
