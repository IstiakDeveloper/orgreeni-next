// File Location: src/contexts/auth-context.tsx
import React, { 
  createContext, 
  useState, 
  useContext, 
  ReactNode, 
  useEffect 
} from 'react';
import { User } from '@/types'; // Use absolute import with @/
import AuthService from '@/services/auth-service'; // Corrected import path
import { useRouter } from 'next/router';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (phone: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (userData: User) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: async () => false,
  logout: async () => {},
  updateUser: () => {}
});

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();

  // Check authentication on initial load
  useEffect(() => {
    const checkAuth = async () => {
      const token = AuthService.getToken();
      if (token) {
        try {
          const response = await AuthService.getCurrentUser();
          if (response.success && response.data?.user) {
            setUser(response.data.user);
            setIsAuthenticated(true);
          } else {
            // Token might be expired
            AuthService.removeToken();
            setIsAuthenticated(false);
          }
        } catch {
          AuthService.removeToken();
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  const login = async (phone: string, password: string): Promise<boolean> => {
    const response = await AuthService.login(phone, password);
    if (response.success && response.data?.user) {
      setUser(response.data.user);
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = async () => {
    await AuthService.logout();
    setUser(null);
    setIsAuthenticated(false);
    router.push('/login');
  };

  const updateUser = (userData: User) => {
    setUser(userData);
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        isAuthenticated, 
        login, 
        logout, 
        updateUser 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for using auth context
export const useAuth = () => useContext(AuthContext);