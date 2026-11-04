import React from 'react';
import { useTheme } from '../context/ThemeContext';

export default function ThemeToggle({ showLabel = true, className = '' }) {
  const { toggleTheme, isDark } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`theme-toggle-btn ${isDark ? 'is-dark' : 'is-light'} ${className}`}
      title={isDark ? "Đang ở chế độ Tối • Nhấn để chuyển sang giao diện Dịu Sáng" : "Đang ở chế độ Sáng • Nhấn để chuyển sang giao diện Tối"}
      aria-label="Chuyển chế độ sáng tối"
      type="button"
      style={{
        background: isDark ? 'rgba(232, 237, 232, 0.08)' : '#FFFFFF',
        borderColor: isDark ? 'rgba(232, 237, 232, 0.18)' : 'rgba(15, 23, 42, 0.18)',
        color: isDark ? 'rgba(232, 237, 232, 0.92)' : '#0F172A',
        boxShadow: isDark ? 'none' : '0 2px 6px rgba(0, 0, 0, 0.06)'
      }}
    >
      <span
        key={isDark ? 'theme-dark' : 'theme-light'}
        className="theme-toggle-slider-content"
      >
        {isDark ? (
          /* Icon Tối (Mặt trăng - Chỉ hiển thị khi ở chế độ Tối) */
          <span className="theme-toggle-icon-wrap icon-moon-wrap">
            <svg
              className="theme-icon theme-icon-moon"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#38BDF8"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
          </span>
        ) : (
          /* Icon Sáng (Mặt trời - Chỉ hiển thị khi ở chế độ Sáng) */
          <span className="theme-toggle-icon-wrap icon-sun-wrap">
            <svg
              className="theme-icon theme-icon-sun"
              width="15"
              height="15"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#F59E0B"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="5" />
              <line x1="12" y1="1" x2="12" y2="3" />
              <line x1="12" y1="21" x2="12" y2="23" />
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
              <line x1="1" y1="12" x2="3" y2="12" />
              <line x1="21" y1="12" x2="23" y2="12" />
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
            </svg>
          </span>
        )}

        {showLabel && (
          <span
            className="theme-toggle-label"
            style={{
              color: isDark ? 'rgba(232, 237, 232, 0.92)' : '#0F172A',
              fontWeight: 700
            }}
          >
            {isDark ? 'Tối' : 'Sáng'}
          </span>
        )}
      </span>
    </button>
  );
}
