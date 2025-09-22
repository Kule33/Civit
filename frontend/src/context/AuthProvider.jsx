// frontend/src/context/AuthProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient'; // Import your Supabase client

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error fetching session:", error);
      } else if (session) {
        setUser(session.user);
        // Assuming user_metadata contains the role
        const userRole = session.user.user_metadata?.role;
        setIsAdmin(userRole === 'admin');
        setIsTeacher(userRole === 'teacher');
      }
      setLoading(false);
    };

    fetchSession();

    // Listen for auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session) {
          setUser(session.user);
          const userRole = session.user.user_metadata?.role;
          setIsAdmin(userRole === 'admin');
          setIsTeacher(userRole === 'teacher');
        } else {
          setUser(null);
          setIsAdmin(false);
          setIsTeacher(false);
        }
        setLoading(false); // Ensure loading is set to false after any auth change
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) throw error;
    // The onAuthStateChange listener will handle setting user and roles
    return data;
  };

  const signup = async (email, password) => { // Removed 'role' parameter
    setLoading(true);
    // HARDCODED ROLE TO 'teacher' for all new signups
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          role: 'teacher', // <--- CRITICAL FIX: Always 'teacher'
        },
      },
    });
    setLoading(false);
    if (error) throw error;
    return data;
  };

  const logout = async () => {
    setLoading(true);
    const { error } = await supabase.auth.signOut();
    setLoading(false);
    if (error) throw error;
    setUser(null);
    setIsAdmin(false);
    setIsTeacher(false);
  };

  const value = {
    user,
    isAdmin,
    isTeacher,
    loading,
    login,
    signup,
    logout,
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