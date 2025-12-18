// frontend/src/context/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient'; // Kept for backwards compatibility
import * as authApi from '../services/authService';
import apiClient from '../services/apiClient';
import { getMyProfile } from '../services/userService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [userProfile, setUserProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const lastAccessTokenRef = useRef(null);
  const lastProfileFetchTsRef = useRef(0);

  console.log('AuthProvider initialized');

  useEffect(() => {
    let isMounted = true;
    
    const fetchSession = async () => {
      console.log('Fetching Supabase session...');
      
      // Short safety timeout since getSession() seems to hang - auth listener will handle it
      const safetyTimeout = setTimeout(() => {
        console.warn('Session fetch taking too long, relying on auth state listener');
        if (isMounted) {
          setLoading(false);
        }
      }, 500);
      
      try {
        console.log('Calling supabase.auth.getSession()...');
        const result = await supabase.auth.getSession();
        console.log('getSession() returned:', result);
        
        clearTimeout(safetyTimeout);
        
        const { data, error } = result;
        const session = data?.session;
        
        console.log('Session fetched:', session ? 'User logged in' : 'No session', error ? `Error: ${error.message}` : '');

        if (error) {
          console.error("Error fetching session:", error);
          if (isMounted) {
            setLoading(false);
            setProfileLoading(false);
          }
          return;
        }
        
        if (session) {
          console.log('User found:', session.user.email, 'Role:', session.user.user_metadata?.role);
          if (isMounted) {
            setUser(session.user);
            const userRole = session.user.user_metadata?.role;
            setIsAdmin(userRole === 'admin');
            setIsTeacher(userRole === 'teacher');
          }
          
          // Fetch user profile
          try {
            console.log('Fetching user profile...');
            const profile = await getMyProfile();
            console.log('Profile loaded:', profile);
            if (isMounted) {
              setUserProfile(profile);
            }
          } catch (error) {
            console.log("Profile not found or error loading:", error.message);
            if (isMounted) {
              setUserProfile(null);
            }
          } finally {
            if (isMounted) {
              setProfileLoading(false);
            }
          }
        } else {
          console.log('No active session, user not logged in');
          if (isMounted) {
            setProfileLoading(false);
          }
        }
        
        if (isMounted) {
          setLoading(false);
        }
        console.log('Auth loading complete');
      } catch (err) {
        console.error('CRITICAL Error in fetchSession:', err);
        console.error('Error stack:', err.stack);
        if (isMounted) {
          setLoading(false);
          setProfileLoading(false);
        }
      }
    };

    fetchSession();
    
    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session ? 'with session' : 'no session');
        
        if (!isMounted) return;
        
        if (session) {
          // Avoid duplicate fetches on React.StrictMode double-mount or rapid events
          const now = Date.now();
          if (lastAccessTokenRef.current === session.access_token && userProfile && (now - lastProfileFetchTsRef.current) < 2000) {
            console.log('Skipping profile refetch (duplicate event within 2s with same token)');
            setLoading(false);
            return;
          }
          lastAccessTokenRef.current = session.access_token;

          console.log('Setting user from auth state change:', session.user.email);
          setUser(session.user);
          const userRole = session.user.user_metadata?.role;
          setIsAdmin(userRole === 'admin');
          setIsTeacher(userRole === 'teacher');
          
          // Fetch user profile - PASS THE ACCESS TOKEN to avoid getSession() deadlock
          setProfileLoading(true);
          try {
            console.log('Fetching profile from auth state change with token from session...');
            const profile = await getMyProfile(session.access_token);
            console.log('Profile fetched from auth state change:', profile);
            if (isMounted) {
              setUserProfile(profile);
              lastProfileFetchTsRef.current = Date.now();
            }
          } catch (error) {
            console.log("Profile not found or error loading:", error.message);
            if (isMounted) {
              setUserProfile(null);
              lastProfileFetchTsRef.current = Date.now();
            }
          } finally {
            if (isMounted) {
              setProfileLoading(false);
            }
          }
        } else {
          console.log('No session, clearing user state');
          setUser(null);
          setIsAdmin(false);
          setIsTeacher(false);
          setUserProfile(null);
          setProfileLoading(false);
        }
        
        // Ensure loading is set to false after any auth change
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      // Call backend login, get access_token
      const data = await authApi.login(email, password);
      const accessToken = data.access_token || data?.session?.access_token;
      const refreshToken = data.refresh_token || data?.session?.refresh_token;
      if (!accessToken) throw new Error('Login failed: no access token');
      // Store token in localStorage to avoid extra refreshes
      localStorage.setItem('auth_token', accessToken);
      if (refreshToken) localStorage.setItem('refresh_token', refreshToken);
      // set default auth header
      apiClient.defaults.headers = apiClient.defaults.headers || {};
      apiClient.defaults.headers.Authorization = `Bearer ${accessToken}`;
      // Fetch profile using token
      const profile = await getMyProfile(accessToken);
      setUserProfile(profile);
      setUser({ email });
      setIsTeacher(true);
      return { access_token: accessToken };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (email, password) => {
    setLoading(true);
    try {
      const data = await authApi.register(email, password, `${window.location.origin}/login`);
      return data;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    console.log('Logout called');
    setLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      console.log('Supabase signOut completed', error ? `Error: ${error.message}` : 'Success');
      if (error) throw error;
      setUser(null);
      setIsAdmin(false);
      setIsTeacher(false);
      setUserProfile(null);
      setProfileLoading(false);
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      console.log('Logout successful');
    } catch (err) {
      console.error('Logout error:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // TODO: Configure in Supabase Dashboard:
  // 1. Go to Authentication → URL Configuration
  // 2. Add redirect URLs:
  //    - Development: http://localhost:5173/reset-password
  //    - Production: https://your-domain.com/reset-password
  // 3. (Optional) Customize email template in Authentication → Email Templates
  const resetPasswordRequest = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  };

  const refreshProfile = async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    setProfileLoading(true);
    try {
      const profile = await getMyProfile(token);
      setUserProfile(profile);
    } catch (error) {
      console.log("Error refreshing profile:", error.message);
      setUserProfile(null);
    } finally {
      setProfileLoading(false);
    }
  };

  const value = {
    user,
    isAdmin,
    isTeacher,
    loading,
    userProfile,
    profileLoading,
    login,
    signup,
    logout,
    resetPasswordRequest,
    updatePassword,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};