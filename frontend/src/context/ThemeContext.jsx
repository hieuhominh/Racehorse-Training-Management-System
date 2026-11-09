import React, { createContext, useContext, useState, useEffect } from 'react';
import { flushSync } from 'react-dom';

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

  const toggleTheme = (e) => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';

    const updateDOM = () => {
      setTheme(nextTheme);
      document.documentElement.setAttribute('data-theme', nextTheme);
      document.body.setAttribute('data-theme', nextTheme);
      try {
        localStorage.setItem('racehorse_theme', nextTheme);
      } catch {}
    };

    // Fast check for modern View Transitions API support
    const isViewTransitionSupported =
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (isViewTransitionSupported) {
      // Get click position for circular wave animation
      let x = window.innerWidth - 120;
      let y = 40;
      if (e) {
        if (typeof e.clientX === 'number' && e.clientX > 0) {
          x = e.clientX;
          y = e.clientY;
        } else if (e.currentTarget && typeof e.currentTarget.getBoundingClientRect === 'function') {
          const rect = e.currentTarget.getBoundingClientRect();
          x = rect.left + rect.width / 2;
          y = rect.top + rect.height / 2;
        }
      }

      const endRadius = Math.hypot(
        Math.max(x, window.innerWidth - x),
        Math.max(y, window.innerHeight - y)
      );

      // flushSync ensures React re-renders synchronously before snapshot
      const transition = document.startViewTransition(() => {
        flushSync(() => {
          updateDOM();
        });
      });

      transition.ready.then(() => {
        try {
          document.documentElement.animate(
            {
              clipPath: [
                `circle(0px at ${x}px ${y}px)`,
                `circle(${endRadius}px at ${x}px ${y}px)`
              ]
            },
            {
              duration: 340,
              easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
              pseudoElement: '::view-transition-new(root)'
            }
          );
        } catch {
          // Native browser view transition takes over if animate with pseudoElement fails
        }
      }).catch(() => {});
    } else {
      // Lightweight fallback for browsers without View Transitions
      const root = document.documentElement;
      root.classList.add('theme-transitioning');
      updateDOM();
      setTimeout(() => {
        root.classList.remove('theme-transitioning');
      }, 300);
    }
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
