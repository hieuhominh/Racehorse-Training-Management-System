import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, title = 'THÔNG BÁO HỆ THỐNG', type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substring(2, 9);
    const newToast = {
      id,
      message,
      title,
      type,
      isFading: false
    };

    // Thêm vào danh sách để các thông báo sau xếp chồng lên nhau (Stacking)
    setToasts((prev) => [...prev, newToast]);

    // Sau 3.6s bắt đầu mờ dần (fade out 400ms) rồi biến mất hẳn ở mốc 4s
    setTimeout(() => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, isFading: true } : t))
      );
      setTimeout(() => {
        removeToast(id);
      }, 400);
    }, 3600);
  }, [removeToast]);

  return (
    <ToastContext.Provider value={{ showToast, addToast: showToast }}>
      {children}

      {/* Top-Right Stacking Toast Container */}
      <div className="premium-toast-container" aria-live="polite">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`premium-toast-item ${toast.isFading ? 'fade-out' : 'fade-in'}`}
            role="alert"
          >
            <div className="toast-accent-line"></div>
            <div className="toast-icon-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--brass)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
              </svg>
            </div>
            <div className="toast-text-wrap">
              <div className="toast-title">{toast.title}</div>
              <div className="toast-msg">{toast.message}</div>
            </div>
            <button
              type="button"
              className="toast-dismiss-btn"
              onClick={() => removeToast(toast.id)}
              aria-label="Đóng"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>
            <div className="toast-progress-bar"></div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
