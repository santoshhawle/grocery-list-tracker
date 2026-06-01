import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { clearAuth, storeAuth } from '../api';
import { clearUserData } from '../services/notificationStorage';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Rehydrate from localStorage on mount
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('wbt_user');
      const storedToken = localStorage.getItem('wbt_token');
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser) as User);
      }
    } catch {
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, []);

  function login(token: string, newUser: User) {
    storeAuth(token, newUser);
    setUser(newUser);
  }

  function logout() {
    if (user) clearUserData(user.id);
    clearAuth();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
