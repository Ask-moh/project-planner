import { createContext, useContext, useState } from 'react';
import { api } from '../api/client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  // Since we use HttpOnly cookies, we just need a flag to know if they are logged in
  const [isAuthenticated, setIsAuthenticated] = useState(() => localStorage.getItem('isAuthenticated') === 'true');
  const [user, setUser] = useState(() => localStorage.getItem('email'));

  const login = async (email, password) => {
    try {
      await api.login({ email, password });
      localStorage.setItem('isAuthenticated', 'true');
      localStorage.setItem('email', email);
      setIsAuthenticated(true);
      setUser({ email });
      return true;
    } catch(e) {
      throw new Error('Invalid credentials');
    }
  };

  const register = async (name, email, password) => {
    // We can use native fetch or api client, let's use the api client if method exists, else fetch:
    const res = await fetch('/api/register/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    
    if (!res.ok) {
      throw new Error('هذا البريد الإلكتروني مستخدم بالفعل أو البيانات غير صالحة.');
    }
    
    // تسجيل الدخول مباشرة بعد نجاح إنشاء الحساب
    await login(email, password);
  };

  const logout = () => {
    api.logout();
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('email');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
