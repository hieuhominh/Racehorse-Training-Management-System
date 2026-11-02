import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try {
      const savedTheme = localStorage.getItem('racehorse_theme');
      if (savedTheme === 'light' || savedTheme === 'dark') {
        return savedTheme;
      }
    } catch {
      // Fallback if localStorage is inaccessible
    }
    return 'dark'; // Default luxury dark equestrian theme
  });

  useEffect(() => {
    try {
      localStorage.setItem('racehorse_theme', theme);
    } catch {
      // Ignore
    }
    document.documentElement.setAttribute('data-theme', theme);
    document.body.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    try {
      const root = document.documentElement;
      root.classList.add('theme-transitioning');
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 450);
    } catch {}

    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  const isDark = theme === 'dark';

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
