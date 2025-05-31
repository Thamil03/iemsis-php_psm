'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check login session
  useEffect(() => {
    fetch('https://dolphin-app-gllbf.ondigitalocean.app/auth/session.php', {
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) setUser(data.user);
      });
  }, []);

  const login = async (email, password) => {
    const res = await fetch('https://dolphin-app-gllbf.ondigitalocean.app/auth/login.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const res = await fetch('https://dolphin-app-gllbf.ondigitalocean.app/auth/register.php', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    return data;
  };

  const logout = async () => {
    await fetch('https://dolphin-app-gllbf.ondigitalocean.app/auth/logout.php', {
      method: 'POST',
      credentials: 'include'
    });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
