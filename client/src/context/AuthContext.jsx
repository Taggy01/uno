import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('uno_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const [token, setToken] = useState(() => localStorage.getItem('uno_token') || '');

  // Auto initialize guest session if no user or token exists
  useEffect(() => {
    const initAuth = async () => {
      if (!user || !token) {
        try {
          const defaultName = user?.username || 'Player_' + Math.floor(1000 + Math.random() * 9000);
          const res = await fetch('/api/auth/guest', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nickname: defaultName }),
          });
          const data = await res.json();
          if (data.success) {
            setUser(data.user);
            setToken(data.token);
          }
        } catch (e) {
          console.error('Failed to init guest token:', e);
        }
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (user) {
      localStorage.setItem('uno_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('uno_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('uno_token', token);
    } else {
      localStorage.removeItem('uno_token');
    }
  }, [token]);

  const login = async (email, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Login failed');
    }
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const signup = async (username, email, password) => {
    const res = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Signup failed');
    }
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const guestLogin = async (nickname) => {
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        return data.user;
      }
    } catch (err) {
      const guest = {
        id: 'guest_' + Math.random().toString(36).substring(2, 9),
        username: nickname || 'Player_' + Math.floor(1000 + Math.random() * 9000),
        isGuest: true,
      };
      setUser(guest);
      return guest;
    }
  };

  const updateUsername = (name) => {
    if (!name.trim()) return;
    setUser((prev) => ({ ...prev, username: name.trim() }));
  };

  const logout = () => {
    guestLogin();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, guestLogin, updateUsername, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
