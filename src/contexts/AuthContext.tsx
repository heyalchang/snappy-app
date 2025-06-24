import React, { createContext, useState, useContext, ReactNode } from 'react';

interface AuthContextType {
  username: string | null;
  signIn: (username: string) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);

  const signIn = (username: string) => {
    setUsername(username);
  };

  const signOut = () => {
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ username, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}