import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { authAPI } from '../utils/api';
import { connectWallet, getCurrentAccount, onAccountsChanged } from '../utils/blockchain';

const AuthContext = createContext(null);

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [walletAddress, setWalletAddress] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const updateWalletAddress = useCallback(async (address) => {
    try {
      await authAPI.updateWallet(address);
      setUser(prev => ({ ...prev, walletAddress: address }));
    } catch (error) {
      console.error('Update wallet error:', error);
    }
  }, []);

  // Listen to wallet changes
  useEffect(() => {
    onAccountsChanged((accounts) => {
      if (accounts.length === 0) {
        setWalletAddress(null);
      } else {
        setWalletAddress(accounts[0]);
        if (user) {
          updateWalletAddress(accounts[0]);
        }
      }
    });
  }, [user, updateWalletAddress]);

  const fetchProfile = useCallback(async () => {
    try {
      const response = await authAPI.getProfile();
      if (response.data?.user) {
        setUser(response.data.user);
        return response.data.user;
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    }
    return null;
  }, []);

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const response = await authAPI.verify();
        if (response.data.success) {
          if (response.data.user) {
            setUser(response.data.user);
          } else {
            await fetchProfile();
          }
        } else {
          localStorage.removeItem('authToken');
        }
      }
    } catch (error) {
      console.error('Auth check error:', error);
      localStorage.removeItem('authToken');
    } finally {
      setLoading(false);
      setAuthChecked(true);
    }
  }, [fetchProfile]);

  const checkWallet = useCallback(async () => {
    try {
      const account = await getCurrentAccount();
      if (account) {
        setWalletAddress(account);
      }
    } catch (error) {
      console.error('Wallet check error:', error);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setLoading(true);
      const response = await authAPI.login({ email, password });
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        const nextUser = response.data.user || (await fetchProfile());
        if (nextUser) {
          setUser(nextUser);
        }
        setLoading(false);
        return { success: true, user: nextUser };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed'
      };
    }
  }, [fetchProfile]);

  const register = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await authAPI.register(userData);
      if (response.data.success) {
        localStorage.setItem('authToken', response.data.token);
        const nextUser = response.data.user || (await fetchProfile());
        if (nextUser) {
          setUser(nextUser);
        }
        setLoading(false);
        return { success: true, user: nextUser };
      }
      return { success: false, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed'
      };
    }
  }, [fetchProfile]);

  const logout = useCallback(() => {
    localStorage.removeItem('authToken');
    setUser(null);
    setWalletAddress(null);
    setAuthChecked(false);
  }, []);

  const connectUserWallet = useCallback(async () => {
    try {
      const { address } = await connectWallet();
      setWalletAddress(address);
      if (user) {
        await updateWalletAddress(address);
      }
      return { success: true, address };
    } catch (error) {
      return {
        success: false,
        message: error.message || 'Failed to connect wallet'
      };
    }
  }, [updateWalletAddress, user]);

  const refreshUser = useCallback(async () => {
    const refreshed = await fetchProfile();
    return refreshed;
  }, [fetchProfile]);

  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  }, []);

  useEffect(() => {
    if (!authChecked) {
      checkAuth();
    }
  }, [authChecked, checkAuth]);

  useEffect(() => {
    checkWallet();
  }, [checkWallet]);

  const value = useMemo(() => ({
    user,
    loading,
    walletAddress,
    login,
    register,
    logout,
    connectWallet: connectUserWallet,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin'
  }), [user, loading, walletAddress, login, register, logout, connectUserWallet, updateUser, refreshUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
