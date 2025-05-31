'use client';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  // Check login session
  useEffect(() => {
    fetch('http://157.230.245.190:8000/auth/session.php', {
      
    })
      .then(res => res.json())
      .then(data => {
        if (data.loggedIn) setUser(data.user);
      });
  }, []);

  const login = async (email, password) => {
    const res = await fetch('http://157.230.245.190:8000/auth/login.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) setUser(data.user);
    return data;
  };

  const register = async (name, email, password) => {
    const res = await fetch('http://157.230.245.190:8000/auth/register.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    return data;
  };

  const logout = async () => {
    await fetch('http://157.230.245.190:8000/auth/logout.php', {
      method: 'POST',
      
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
