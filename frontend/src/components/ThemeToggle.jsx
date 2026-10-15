import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ showLabel = true, className = '' }) {
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-btn ${className}`}
      title={isDark ? "Chuyển sang giao diện Sáng (Light Mode)" : "Chuyển sang giao diện Tối (Dark Mode)"}
      aria-label="Chuyển chế độ sáng tối"
      type="button"
    >
      <span className="theme-toggle-icon">{isDark ? '☀️' : '🌙'}</span>
      {showLabel && (
        <span className="theme-toggle-text">{isDark ? 'Sáng' : 'Tối'}</span>
      )}
    </button>
  );
}
