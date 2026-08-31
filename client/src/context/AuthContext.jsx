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
  const [authLoading, setAuthLoading] = useState(false);

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
    return sendOtp(username, email, password);
  };

  const sendOtp = async (username, email, password) => {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to send OTP');
    }
    return data;
  };


  const verifyOtpAndSignup = async (email, otp) => {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'OTP verification failed');
    }
    setUser(data.user);
    setToken(data.token);
    return data.user;
  };

  const changePassword = async (currentPassword, newPassword) => {
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to change password');
    }
    return data;
  };

  const refreshProfile = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
      }
    } catch (e) {
      // Ignore
    }
  };

  const guestLogin = async (nickname) => {
    const cleanNick = (nickname || '').trim() || `Player_${Math.floor(1000 + Math.random() * 9000)}`;
    try {
      const res = await fetch('/api/auth/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname: cleanNick }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        setUser(data.user);
        setToken(data.token || 'guest_token');
        return data.user;
      }
    } catch (err) {
      // Fallback
    }

    const guest = {
      id: 'guest_' + Math.random().toString(36).substring(2, 9),
      username: cleanNick,
      isGuest: true,
      stats: { gamesPlayed: 0, wins: 0, score: 0 },
    };
    setUser(guest);
    setToken('guest_token_' + Date.now());
    return guest;
  };

  const updateUsername = (name) => {
    if (!name.trim()) return;
    setUser((prev) => (prev ? { ...prev, username: name.trim() } : prev));
  };

  const logout = () => {
    setUser(null);
    setToken('');
    localStorage.removeItem('uno_user');
    localStorage.removeItem('uno_token');
  };


  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        authLoading,
        login,
        signup,
        sendOtp,
        verifyOtpAndSignup,
        changePassword,
        refreshProfile,
        guestLogin,
        updateUsername,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

